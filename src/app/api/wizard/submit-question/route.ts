import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { addWizardQuestion } from '@/src/repositories/requests/repo';
import { validateQuestionText } from '@/src/app/components/forms/validation/request';
import { QuestionStatusesE } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic';

type PaymentMethod = 'free' | 'later';

interface SubmitQuestionBody {
  question?: string;
  paymentMethod?: PaymentMethod;
}

/**
 * Wizard's final question-submission endpoint.
 * Handles the methods that don't go through a payment gateway right now:
 *   - 'free'  : user is on their first-question-free benefit → create the
 *               question InProgress so a lawyer can pick it up.
 *   - 'later' : user opted to pay later → create the question Unpaid;
 *               front-end then redirects to the profile screen where
 *               the user can pay from their account.
 *
 * Card payments are handled separately via /api/orders (type=OneTime) +
 * Alfa-Bank redirect. Balance payments will get their own endpoint in task 7.
 */
export async function POST(request: NextRequest) {
  const msg = 'API wizard/submit-question - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  let body: SubmitQuestionBody;
  try {
    body = (await request.json()) as SubmitQuestionBody;
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

  const method = body.paymentMethod;
  if (method !== 'free' && method !== 'later') {
    return NextResponse.json(
      {
        success: false,
        code: 'invalid_method',
        message: 'Этот способ оплаты обрабатывается отдельным эндпоинтом.',
      },
      { status: 400 },
    );
  }

  const userId = session.user.id.toString();
  const status = method === 'free' ? QuestionStatusesE.InProgress : QuestionStatusesE.Unpaid;

  const question = await addWizardQuestion(userId, questionText, status);
  if (!question) {
    logger.error(msg + 'failed to insert question', { user_id: userId, method });
    return NextResponse.json(
      { success: false, code: 'create_failed', message: 'Не удалось сохранить вопрос. Попробуйте позже.' },
      { status: 500 },
    );
  }

  logger.info(msg + 'wizard question created', {
    user_id: userId,
    question_id: question.id,
    status,
    method,
  });

  return NextResponse.json(
    {
      success: true,
      question: {
        id: question.id,
        uuid: question.uuid,
        status: question.status,
      },
    },
    { status: 200 },
  );
}
