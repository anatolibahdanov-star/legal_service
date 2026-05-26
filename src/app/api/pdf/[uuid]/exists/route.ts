import { NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { hasCachedPdf } from '@/src/services/pdf';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-fA-F-]{32,36}$/;

/**
 * Lightweight cache check — touches only the DB, never S3 or Quarkdown.
 * Used by the UI to pick the right loader label on the "Скачать PDF" button
 * ("Загружаем…" when cached, "Генерируем…" otherwise).
 *
 *   GET /api/pdf/<uuid>/exists → { exists: boolean }
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;
  if (!UUID_RE.test(uuid)) {
    return NextResponse.json(
      { success: false, message: 'Invalid uuid' },
      { status: 400 },
    );
  }
  try {
    const exists = await hasCachedPdf(uuid);
    return NextResponse.json({ success: true, exists }, { status: 200 });
  } catch (err) {
    logger.error('API pdf exists - error', { uuid, error: (err as Error).message });
    return NextResponse.json({ success: true, exists: false }, { status: 200 });
  }
}
