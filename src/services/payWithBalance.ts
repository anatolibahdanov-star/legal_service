import logger from '@/src/libs/logger';
import { chargeUserBalance } from '@/src/repositories/balances/repo';
import { createEmptyOrder, updateOrderQuestionLink } from '@/src/repositories/orders/repo';
import { addWizardQuestion } from '@/src/repositories/requests/repo';
import { getUsersByIds } from '@/src/repositories/users/repo';
import { OrderStatusE, OrderTypeE } from '@/src/interfaces/payment';
import { QuestionStatusesE } from '@/src/interfaces/data';
import { UserBalanceRequest } from '@/src/interfaces/api';

const msgGlobal = 'SERVICE PAY-BALANCE ';

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

export interface PayWithBalanceResult {
  ok: boolean;
  code?: 'insufficient' | 'user_not_found' | 'create_failed' | 'charge_failed' | 'internal';
  message?: string;
  questionId?: string;
  questionUuid?: string;
  orderId?: string;
}

interface CachedEntry {
  promise: Promise<PayWithBalanceResult>;
  expiresAt: number;
}

declare global {
  // Survives Next.js HMR by sticking to globalThis.
  var __payBalanceInFlight__: Map<string, CachedEntry> | undefined;
}

const inFlight: Map<string, CachedEntry> =
  globalThis.__payBalanceInFlight__ ?? (globalThis.__payBalanceInFlight__ = new Map());

const pruneInFlight = () => {
  const now = Date.now();
  for (const [key, entry] of inFlight) {
    if (entry.expiresAt <= now) inFlight.delete(key);
  }
};

interface PayParams {
  userId: string | number;
  questionText: string;
  amount: number;
  idempotencyKey: string;
}

/**
 * Charges the user's balance and binds the payment to a freshly created
 * question. Designed to be the *final* operation for "pay with balance":
 * once it returns success, the question has status InProgress and the
 * order is marked Paid.
 *
 * Idempotency: keyed by `idempotencyKey`. Concurrent or repeated requests
 * with the same key receive the same result (no double-charge). Entries
 * are kept in-memory for IDEMPOTENCY_TTL_MS (5 min).
 *
 * Sequence:
 *   1. Verify user exists, balance pre-check (UX hint only)
 *   2. Atomic debit via chargeUserBalance (true safety net)
 *   3. Create order (type=OneTime, status=Paid)
 *   4. Create question (status=InProgress)
 *   5. Link order.question_id = question.id
 * Each step is logged.
 */
export async function payQuestionWithBalance(params: PayParams): Promise<PayWithBalanceResult> {
  pruneInFlight();
  const { idempotencyKey } = params;
  const cached = inFlight.get(idempotencyKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.info(msgGlobal + 'idempotency hit — returning cached promise', {
      idempotency_key: idempotencyKey,
      user_id: params.userId,
    });
    return cached.promise;
  }

  const promise = runPayment(params);
  inFlight.set(idempotencyKey, {
    promise,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
  // Don't delete on error — repeated retries with the same key would still
  // be intercepted within the TTL window, keeping idempotency clean.
  return promise;
}

async function runPayment(params: PayParams): Promise<PayWithBalanceResult> {
  const { userId, questionText, amount, idempotencyKey } = params;
  const ctx = {
    user_id: userId,
    amount,
    idempotency_key: idempotencyKey,
  };

  logger.info(msgGlobal + 'start', ctx);

  // 1. Fresh user fetch — balance from DB, not the (possibly stale) session.
  const user = await getUsersByIds([userId.toString()]);
  if (!user) {
    logger.error(msgGlobal + 'user not found', ctx);
    return { ok: false, code: 'user_not_found', message: 'Пользователь не найден.' };
  }
  if ((user.balance ?? 0) < amount) {
    logger.warn(msgGlobal + 'pre-check failed: insufficient balance', {
      ...ctx,
      balance: user.balance,
    });
    return { ok: false, code: 'insufficient', message: 'Недостаточно средств на балансе.' };
  }
  logger.info(msgGlobal + 'pre-check passed', { ...ctx, balance: user.balance });

  // 2. Create an empty Paid OneTime order first so the ledger row has a
  //    real order_id reference. Question link is set in step 5.
  const orderRequest: UserBalanceRequest = {
    amount,
    orderNumber: `wizard_balance_${Date.now()}`,
    type: OrderTypeE.OneTime,
    status: OrderStatusE.Paid,
  };
  const order = await createEmptyOrder(userId.toString(), orderRequest);
  if (!order) {
    logger.error(msgGlobal + 'failed to create order', ctx);
    return { ok: false, code: 'create_failed', message: 'Не удалось создать платёж.' };
  }
  logger.info(msgGlobal + 'order created', { ...ctx, order_id: order.id });

  // 3. Atomic debit. This is the authoritative check for balance >= amount.
  //    If concurrent attempts try to debit the same user, only one wins.
  const charge = await chargeUserBalance(userId, amount, parseInt(order.id));
  if (!charge.ok) {
    logger.error(msgGlobal + 'charge failed', { ...ctx, reason: charge.reason });
    return {
      ok: false,
      code: charge.reason === 'insufficient' ? 'insufficient' : 'charge_failed',
      message:
        charge.reason === 'insufficient'
          ? 'Недостаточно средств на балансе.'
          : 'Не удалось списать средства.',
    };
  }
  logger.info(msgGlobal + 'charged', { ...ctx, ledger_id: charge.transactionId });

  // 4. Create the question as paid → InProgress.
  const question = await addWizardQuestion(userId, questionText, QuestionStatusesE.InProgress);
  if (!question) {
    logger.error(msgGlobal + 'failed to create question after charge', {
      ...ctx,
      order_id: order.id,
    });
    // Money was deducted but question creation failed. Mark visibly so admins
    // can refund/recover manually. Order stays Paid with no question_id link.
    return {
      ok: false,
      code: 'create_failed',
      message: 'Оплата прошла, но не удалось создать вопрос. Свяжитесь с поддержкой.',
    };
  }
  logger.info(msgGlobal + 'question created', { ...ctx, question_id: question.id });

  // 5. Link order ↔ question so the payment is fully traceable.
  await updateOrderQuestionLink(order.id, question.id);

  logger.info(msgGlobal + 'success', {
    ...ctx,
    order_id: order.id,
    question_id: question.id,
  });

  return {
    ok: true,
    questionId: question.id.toString(),
    questionUuid: question.uuid,
    orderId: order.id,
  };
}
