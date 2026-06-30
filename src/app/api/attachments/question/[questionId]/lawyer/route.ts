import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { getQuestionsByIds } from '@/src/repositories/requests/repo';
import { countByQuestionId } from '@/src/repositories/question_attachments/repo';
import { storeUploadedFiles } from '@/src/services/attachments';
import { validateAttachmentSet } from '@/src/app/components/forms/validation/attachments';
import logger from '@/src/libs/logger';

export const dynamic = 'force-dynamic';

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'lowyer';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const msg = 'API ATTACHMENTS POST (lawyer) - ';
  const { questionId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 });
  }
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, message: 'Доступ запрещён.' }, { status: 403 });
  }

  const questions = await getQuestionsByIds([questionId]);
  if (!questions || questions.length === 0) {
    return NextResponse.json({ success: false, message: 'Запрос не найден.' }, { status: 404 });
  }
  const question = questions[0];

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

  const existingCount = await countByQuestionId(questionId, 'lawyer');
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
    source: 'lawyer',
    uploadedByAdminId: session.user.id,
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
