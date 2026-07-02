import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getQuestionsByIds, getJobById } from '@/src/repositories/requests/repo';
import {
  getAttachmentsByQuestionId,
  getAttachmentsByQuestionIds,
  countByQuestionId,
} from '@/src/repositories/question_attachments/repo';
import { storeUploadedFiles, toAttachmentDTO } from '@/src/services/attachments';
import { validateAttachmentSet } from '@/src/app/components/forms/validation/attachments';
import { QuestionStatusesE } from '@/src/interfaces/data';
import { AttachmentDTO } from '@/src/interfaces/db';
import logger from '@/src/libs/logger';

export const dynamic = 'force-dynamic';

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'lowyer';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const msg = 'API ATTACHMENTS GET - ';
  const { questionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({}, { status: 200 });
  }

  const questions = await getQuestionsByIds([questionId]);
  if (!questions || questions.length === 0) {
    return NextResponse.json({}, { status: 200 });
  }
  const question = questions[0];

  const staff = isStaff(session.user.role);
  const isOwner = question.user_id?.toString() === session.user.id.toString();
  if (!staff && !isOwner) {
    return NextResponse.json({}, { status: 200 });
  }
  const sourceFilter = staff || isOwner ? undefined : ('user' as const);

  try {
    const wantsThread = request.nextUrl.searchParams.get('thread') === '1';
    if (wantsThread) {
      const rootId = question.parent_id ? Number(question.parent_id) : Number(question.id);
      const thread = await getJobById(rootId);
      const ids = (thread ?? []).map((m) => Number(m.id));
      const rows = await getAttachmentsByQuestionIds(ids, sourceFilter);
      const map: Record<string, AttachmentDTO[]> = {};
      for (const row of rows) {
        const key = String(row.question_id);
        (map[key] ??= []).push(toAttachmentDTO(row));
      }
      return NextResponse.json(map, { status: 200 });
    }

    const rows = await getAttachmentsByQuestionId(questionId, sourceFilter);
    return NextResponse.json(rows.map(toAttachmentDTO), { status: 200 });
  } catch (err) {
    logger.error(msg + 'read failed', { questionId, error: (err as Error).message });
    return NextResponse.json({ success: false, message: 'Ошибка при получении файлов.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const msg = 'API ATTACHMENTS POST (user) - ';
  const { questionId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 });
  }

  const questions = await getQuestionsByIds([questionId]);
  if (!questions || questions.length === 0) {
    return NextResponse.json({ success: false, message: 'Запрос не найден.' }, { status: 404 });
  }
  const question = questions[0];

  if (question.user_id?.toString() !== session.user.id.toString()) {
    return NextResponse.json({ success: false, message: 'Доступ запрещён.' }, { status: 403 });
  }

  const existingCount = await countByQuestionId(questionId, 'user');
  const status = Number(question.status);
  const editable = existingCount === 0
    && (status === QuestionStatusesE.Unpaid || status === QuestionStatusesE.New);
  if (!editable) {
    return NextResponse.json(
      { success: false, message: 'Файлы нельзя изменить после отправки запроса.' },
      { status: 409 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Некорректный запрос.' }, { status: 400 });
  }
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ success: true, attachments: [] }, { status: 200 });
  }

  const setCheck = validateAttachmentSet(
    files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    existingCount,
  );
  if (!setCheck.ok) {
    return NextResponse.json({ success: false, message: setCheck.error }, { status: 400 });
  }

  const result = await storeUploadedFiles({
    questionId,
    userId: question.user_id,
    source: 'user',
    files,
  });
  if (result.error) {
    return NextResponse.json(
      { success: false, message: result.error, attachments: result.created },
      { status: 400 },
    );
  }

  logger.info(msg + 'stored', { questionId, count: result.created.length });
  return NextResponse.json({ success: true, attachments: result.created }, { status: 200 });
}
