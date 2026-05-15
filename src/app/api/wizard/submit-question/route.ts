import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getWizardQuestionById, updateWizardQuestionStatus } from '@/src/repositories/requests/repo';
import { markFirstQuestionUsed } from '@/src/repositories/users/repo';
import { isFirstQuestionFree } from '@/src/services/firstQuestion';
import { QuestionStatusesE } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic';

type PaymentMethod = 'free' | 'later';

interface SubmitQuestionBody {
  questionId?: string | number;
  paymentMethod?: PaymentMethod;
}

/**
 * Step 5 of the wizard for non-gateway payment methods.
 *
 * Contract: the question already exists in the DB (created on Step 3
 * with status Unpaid). This endpoint never creates a question; it only
 * updates the status:
 *   - 'free'  : verify the first-question-free benefit, flip to InProgress.
 *   - 'later' : status stays Unpaid (no DB change), the client just
 *               navigates to the success screen. Kept as an explicit
 *               server call so we have a single place to log the decision.
 *
 * Card payments don't pass through here — they go via /api/orders
 * (OneTime) and the Alfa callback flips the status.
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

  const questionId = body.questionId;
  if (questionId === undefined || questionId === null || questionId === '') {
    return NextResponse.json(
      { success: false, code: 'invalid_question_id', message: 'Не указан id вопроса.' },
      { status: 400 },
    );
  }

  const userId = session.user.id.toString();

  const question = await getWizardQuestionById(questionId, userId);
  if (!question) {
    logger.warn(msg + 'question not found or not owned by user', {
      user_id: userId,
      question_id: questionId,
    });
    return NextResponse.json(
      { success: false, code: 'not_found', message: 'Вопрос не найден.' },
      { status: 404 },
    );
  }

  // Если вопрос уже не Unpaid — оплата по нему уже прошла. Идемпотентно
  // возвращаем текущее состояние, чтобы не дёргать lawyer-flow повторно.
  if (question.status !== QuestionStatusesE.Unpaid) {
    logger.info(msg + 'question already finalized — returning as-is', {
      user_id: userId,
      question_id: question.id,
      status: question.status,
    });
    return NextResponse.json(
      {
        success: true,
        question: { id: question.id, uuid: question.uuid, status: question.status },
        already_finalized: true,
      },
      { status: 200 },
    );
  }

  if (method === 'later') {
    // Статус остаётся Unpaid. Клиент покажет "Ваш вопрос сохранён".
    logger.info(msg + 'pay-later — status stays Unpaid', {
      user_id: userId,
      question_id: question.id,
    });
    return NextResponse.json(
      {
        success: true,
        question: { id: question.id, uuid: question.uuid, status: question.status },
      },
      { status: 200 },
    );
  }

  // method === 'free' — проверяем бенефит и переводим в InProgress.
  const firstFree = await isFirstQuestionFree(userId);
  if (!firstFree) {
    logger.warn(msg + 'free claim rejected — user not entitled', {
      user_id: userId,
      question_id: question.id,
    });
    return NextResponse.json(
      {
        success: false,
        code: 'not_entitled',
        message: 'Бесплатный вопрос недоступен. Выберите способ оплаты.',
      },
      { status: 403 },
    );
  }

  const updated = await updateWizardQuestionStatus(
    question.id,
    QuestionStatusesE.InProgress,
    userId,
  );
  if (!updated) {
    logger.error(msg + 'status update failed', {
      user_id: userId,
      question_id: question.id,
    });
    return NextResponse.json(
      { success: false, code: 'update_failed', message: 'Не удалось обновить статус вопроса.' },
      { status: 500 },
    );
  }

  // Бенефит «первый вопрос бесплатно» сжигаем именно здесь — когда вопрос
  // действительно ушёл в работу по free-пути. На стадии создания черновика
  // (addWizardQuestion) это делать нельзя: клиент к тому моменту уже держит
  // isFirstQuestionFree=true в стейте и упрётся в 403 not_entitled.
  await markFirstQuestionUsed(userId);

  logger.info(msg + 'free question finalized', {
    user_id: userId,
    question_id: updated.id,
  });

  return NextResponse.json(
    {
      success: true,
      question: { id: updated.id, uuid: updated.uuid, status: updated.status },
    },
    { status: 200 },
  );
}
