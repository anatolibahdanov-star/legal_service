import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getQuestionsByIds } from '@/src/repositories/requests/repo';
import { triggerBackgroundGeneration } from '@/src/services/pdf';
import { getOrCreateShareUrl } from '@/src/services/pdf/shareLink';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-fA-F-]{32,36}$/;

/**
 * Returns (and mints on first call) the public, non-expiring share URL for a
 * question's PDF. Used by the LK modal to populate "copy link" and to know
 * which URL to display before any share action is taken.
 *
 *   POST /api/pdf/<uuid>/share-link → { url, token }
 *
 * Authenticated; only the question's owner can mint a link for it.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const msg = 'API pdf share-link POST - ';
  const { uuid } = await params;
  if (!UUID_RE.test(uuid)) {
    return NextResponse.json(
      { success: false, message: 'Invalid uuid' },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  const rows = await getQuestionsByIds([uuid], false);
  const question = rows?.[0];
  if (!question) {
    return NextResponse.json(
      { success: false, message: 'Вопрос не найден.' },
      { status: 404 },
    );
  }
  if (String(question.user_id) !== String(session.user.id)) {
    return NextResponse.json(
      { success: false, message: 'Доступ запрещён.' },
      { status: 403 },
    );
  }

  const url = await getOrCreateShareUrl(Number(question.id), Number(question.user_id));
  if (!url) {
    logger.error(msg + 'mint failed', { uuid, question_id: question.id });
    return NextResponse.json(
      { success: false, message: 'Не удалось сформировать ссылку.' },
      { status: 500 },
    );
  }

  // Kick off Quarkdown generation in the background so the link recipient
  // doesn't hit a cold start. Idempotent: skips when the PDF is already in
  // File Storage.
  triggerBackgroundGeneration(uuid);

  return NextResponse.json({ success: true, url }, { status: 200 });
}
