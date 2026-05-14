import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getQuestionPrice } from '@/src/services/pricing';
import { payQuestionWithBalance } from '@/src/services/payWithBalance';

export const dynamic = 'force-dynamic';

interface PayWithBalanceBody {
  questionId?: string | number;
  idempotencyKey?: string;
}

/**
 * Wizard: charges the user's balance for an already-existing Unpaid
 * question, then flips its status to InProgress.
 *
 * Mandatory body fields:
 *   - questionId:      id of the question created on Step 3
 *   - idempotencyKey:  client-generated UUID; protects against double-charge
 *                       on retries / accidental double-clicks.
 *
 * Auth: a signed-in NextAuth session is required. user_id is taken
 * from the session, not the body — so a malicious client can't charge
 * someone else's account or finalize someone else's question.
 */
export async function POST(request: NextRequest) {
  const msg = 'API wizard/pay-with-balance - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn(msg + 'no session');
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  let body: PayWithBalanceBody;
  try {
    body = (await request.json()) as PayWithBalanceBody;
  } catch {
    return NextResponse.json(
      { success: false, code: 'invalid_body', message: 'Некорректный запрос.' },
      { status: 400 },
    );
  }

  const questionId = body.questionId;
  if (questionId === undefined || questionId === null || questionId === '') {
    return NextResponse.json(
      { success: false, code: 'invalid_question_id', message: 'Не указан id вопроса.' },
      { status: 400 },
    );
  }

  const idempotencyKey = (body.idempotencyKey ?? '').trim();
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json(
      {
        success: false,
        code: 'invalid_idempotency_key',
        message: 'Отсутствует ключ идемпотентности.',
      },
      { status: 400 },
    );
  }

  const price = getQuestionPrice();
  const userId = session.user.id.toString();

  logger.info(msg + 'request received', {
    user_id: userId,
    question_id: questionId,
    price,
    idempotency_key: idempotencyKey,
  });

  const result = await payQuestionWithBalance({
    userId,
    questionId,
    amount: price,
    idempotencyKey,
  });

  if (!result.ok) {
    const status =
      result.code === 'insufficient'
        ? 402
        : result.code === 'user_not_found' || result.code === 'question_not_found'
          ? 404
          : result.code === 'already_paid'
            ? 409
            : 500;
    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message: result.message,
      },
      { status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      question: {
        id: result.questionId,
        uuid: result.questionUuid,
      },
      orderId: result.orderId,
      amount: result.amount,
    },
    { status: 200 },
  );
}
