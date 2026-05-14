import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { addWizardQuestion, updateWizardQuestionText } from '@/src/repositories/requests/repo';
import { validateQuestionText } from '@/src/app/components/forms/validation/request';
import { QuestionStatusesE } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic';

interface CreateQuestionBody {
  question?: string;
}

interface UpdateQuestionBody {
  questionId?: string | number;
  question?: string;
}

/**
 * Step 3 of the wizard: as soon as the user is authenticated (either
 * after OTP-verify for existing users, or after complete-profile for
 * new ones), the question is persisted in the DB with status Unpaid.
 *
 * Step 5 (payment) then only flips this row's status — it never
 * creates a new question.
 *
 * Auth: a signed-in NextAuth session is required. user_id is read from
 * the session, never from the body.
 */
export async function POST(request: NextRequest) {
  const msg = 'API wizard/create-question - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  let body: CreateQuestionBody;
  try {
    body = (await request.json()) as CreateQuestionBody;
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

  const userId = session.user.id.toString();
  const question = await addWizardQuestion(userId, questionText, QuestionStatusesE.Unpaid);
  if (!question) {
    logger.error(msg + 'failed to insert Unpaid question', { user_id: userId });
    return NextResponse.json(
      { success: false, code: 'create_failed', message: 'Не удалось сохранить вопрос. Попробуйте позже.' },
      { status: 500 },
    );
  }

  logger.info(msg + 'Unpaid question created', {
    user_id: userId,
    question_id: question.id,
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

/**
 * Same wizard session, but the user went back to Step 1 and edited
 * the question text. Updates the existing Unpaid row in place so the
 * DB doesn't drift from what the user actually sees on screen.
 *
 * Refuses to update if the question is no longer Unpaid (already paid)
 * — at that point edits are an admin-only concern.
 */
export async function PATCH(request: NextRequest) {
  const msg = 'API wizard/create-question PATCH - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  let body: UpdateQuestionBody;
  try {
    body = (await request.json()) as UpdateQuestionBody;
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

  const questionText = (body.question ?? '').trim();
  const questionError = validateQuestionText(questionText);
  if (questionError) {
    return NextResponse.json(
      { success: false, code: 'invalid_question', message: questionError },
      { status: 400 },
    );
  }

  const userId = session.user.id.toString();
  const updated = await updateWizardQuestionText(questionId, questionText, userId);
  if (!updated) {
    logger.warn(msg + 'update rejected (not found / wrong owner / not Unpaid)', {
      user_id: userId,
      question_id: questionId,
    });
    return NextResponse.json(
      {
        success: false,
        code: 'not_updatable',
        message: 'Этот вопрос уже нельзя редактировать.',
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      question: {
        id: updated.id,
        uuid: updated.uuid,
        status: updated.status,
      },
    },
    { status: 200 },
  );
}
