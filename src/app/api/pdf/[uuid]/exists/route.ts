import { NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { hasCachedPdf } from '@/src/services/pdf';
import { PDF_ID_REGEX } from '@/src/services/pdf/shortId';

export const dynamic = 'force-dynamic';

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
  if (!PDF_ID_REGEX.test(uuid)) {
    return NextResponse.json(
      { success: false, message: 'Invalid id' },
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
