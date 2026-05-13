import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { validateQuestionText } from '@/src/app/components/forms/validation/request';
import { getQuestionPrice } from '@/src/services/pricing';
import { payQuestionWithBalance } from '@/src/services/payWithBalance';

export const dynamic = 'force-dynamic';

interface PayWithBalanceBody {
  question?: string;
  idempotencyKey?: string;
}

/**
 * Wizard: charges the user's balance for one question.
 * Mandatory body fields:
 *   - question:        the question text (re-validated server-side)
 *   - idempotencyKey:  client-generated UUID; protects against double-charge
 *                       on retries / accidental double-clicks.
 *
 * Auth: a signed-in NextAuth session is required. The user id is taken
 * from the session, not from the body, so a malicious client can't charge
 * someone else's account.
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

  const questionText = (body.question ?? '').trim();
  const questionError = validateQuestionText(questionText);
  if (questionError) {
    return NextResponse.json(
      { success: false, code: 'invalid_question', message: questionError },
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
    price,
    idempotency_key: idempotencyKey,
  });

  const result = await payQuestionWithBalance({
    userId,
    questionText,
    amount: price,
    idempotencyKey,
  });

  if (!result.ok) {
    const status = result.code === 'insufficient' ? 402 : result.code === 'user_not_found' ? 404 : 500;
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
    },
    { status: 200 },
  );
}
