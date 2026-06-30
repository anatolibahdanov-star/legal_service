import logger from '@/src/libs/logger';
import { chargeUserBalance } from '@/src/repositories/balances/repo';
import { chargeFreeQuestion } from '@/src/repositories/freeQuestions/repo';
import { createEmptyOrder, updateOrderQuestionLink } from '@/src/repositories/orders/repo';
import {
  getWizardQuestionById,
  updateWizardQuestionStatus,
} from '@/src/repositories/requests/repo';
import { getUsersByIds } from '@/src/repositories/users/repo';
import { OrderStatusE, OrderTypeE } from '@/src/interfaces/payment';
import { QuestionStatusesE } from '@/src/interfaces/data';
import { UserBalanceRequest } from '@/src/interfaces/api';

const msgGlobal = 'SERVICE PAY-BALANCE ';

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

export interface PayWithBalanceResult {
  ok: boolean;
  code?:
    | 'insufficient'
    | 'user_not_found'
    | 'question_not_found'
    | 'already_paid'
    | 'create_failed'
    | 'charge_failed'
    | 'update_failed'
    | 'internal';
  message?: string;
  questionId?: string;
  questionUuid?: string;
  orderId?: string;
  amount?: number;
  /** True when the question was covered by a granted free question (no money charged). */
  freeUsed?: boolean;
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
  questionId: string | number;
  amount: number;
  idempotencyKey: string;
}

/**
 * Charges the user's balance for an EXISTING Unpaid question and flips
 * its status to InProgress. The question must already exist in the DB
 * (created on Step 3 of the wizard).
 *
 * Idempotency: keyed by `idempotencyKey`. Concurrent or repeated requests
 * with the same key receive the same result (no double-charge). Entries
 * are kept in-memory for IDEMPOTENCY_TTL_MS (5 min).
 *
 * Sequence:
 *   1. Verify user + question exist and the question belongs to the user
 *   2. Pre-check balance (UX hint only)
 *   3. Create order (type=OneTime, status=Paid, question_id pre-set)
 *   4. Atomic debit via chargeUserBalance (true safety net)
 *   5. Flip question status: Unpaid → InProgress
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
  const { userId, questionId, amount, idempotencyKey } = params;
  const ctx = {
    user_id: userId,
    question_id: questionId,
    amount,
    idempotency_key: idempotencyKey,
  };

  logger.info(msgGlobal + 'start', ctx);

  // 1a. Question must exist, belong to the user, and still be Unpaid.
  const question = await getWizardQuestionById(questionId, userId);
  if (!question) {
    logger.error(msgGlobal + 'question not found / wrong owner', ctx);
    return { ok: false, code: 'question_not_found', message: 'Вопрос не найден.' };
  }
  if (question.status !== QuestionStatusesE.Unpaid) {
    logger.warn(msgGlobal + 'question already finalized — refusing to re-charge', {
      ...ctx,
      status: question.status,
    });
    return {
      ok: false,
      code: 'already_paid',
      message: 'Этот вопрос уже оплачен.',
    };
  }

  // 1a-bis. Free-first: если пользователю начислены бесплатные вопросы,
  // списываем один вместо денег и сразу переводим вопрос в работу. Декремент
  // атомарный (free_questions >= 1), повторный вызов перехватит уже не-Unpaid
  // статус выше — двойного списания не будет.
  const freeCharge = await chargeFreeQuestion(userId, question.id);
  if (freeCharge.ok) {
    const updatedFree = await updateWizardQuestionStatus(
      question.id,
      QuestionStatusesE.InProgress,
      userId,
    );
    if (!updatedFree) {
      logger.error(msgGlobal + 'status update failed AFTER free charge', {
        ...ctx,
        operation_id: freeCharge.operationId,
      });
      return {
        ok: false,
        code: 'update_failed',
        message: 'Бесплатный вопрос списан, но не удалось обновить статус. Свяжитесь с поддержкой.',
      };
    }
    logger.info(msgGlobal + 'paid with free question', {
      ...ctx,
      operation_id: freeCharge.operationId,
    });
    return {
      ok: true,
      freeUsed: true,
      amount: 0,
      questionId: updatedFree.id.toString(),
      questionUuid: updatedFree.uuid,
    };
  }

  // 1b. Fresh user fetch — balance from DB, not the (possibly stale) session.
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

  // 2. Create a Paid OneTime order, pre-linked to the question so the
  //    ledger row has a real reference from the start.
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
  await updateOrderQuestionLink(order.id, question.id);
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

  // 4. Flip the question status: Unpaid → InProgress.
  const updated = await updateWizardQuestionStatus(
    question.id,
    QuestionStatusesE.InProgress,
    userId,
  );
  if (!updated) {
    logger.error(msgGlobal + 'status update failed AFTER charge', {
      ...ctx,
      order_id: order.id,
    });
    // Money was deducted but the status flip failed. Manual reconciliation
    // is needed — order stays Paid, question stays Unpaid.
    return {
      ok: false,
      code: 'update_failed',
      message: 'Оплата прошла, но не удалось обновить статус. Свяжитесь с поддержкой.',
    };
  }

  logger.info(msgGlobal + 'success', {
    ...ctx,
    order_id: order.id,
    question_id: updated.id,
  });

  return {
    ok: true,
    questionId: updated.id.toString(),
    questionUuid: updated.uuid,
    orderId: order.id,
    amount,
  };
}
