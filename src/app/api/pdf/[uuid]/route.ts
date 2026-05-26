import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { getOrGeneratePdf, PdfNotFoundError } from '@/src/services/pdf';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-fA-F-]{32,36}$/;

/**
 * Public, non-expiring endpoint that serves the PDF for a question by uuid.
 * The first call generates and caches the PDF in S3; subsequent calls stream
 * it back from cache.
 *
 *   GET /api/pdf/<uuid>            → inline (browser viewer / preview)
 *   GET /api/pdf/<uuid>?download=1 → forces a "Save as…" prompt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const msg = 'API pdf GET - ';
  const { uuid } = await params;
  if (!UUID_RE.test(uuid)) {
    return NextResponse.json(
      { success: false, message: 'Invalid uuid' },
      { status: 400 },
    );
  }

  try {
    const result = await getOrGeneratePdf(uuid);
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'PDF not found' },
        { status: 404 },
      );
    }
    const download = request.nextUrl.searchParams.get('download') === '1';
    const filename = `enki-answer-${uuid}.pdf`;
    const disposition = download ? 'attachment' : 'inline';
    // ETag based on content hash — browsers will revalidate on every request
    // and get a fast 304 when content hasn't changed, but pick up regenerated
    // PDFs immediately (e.g. after the lawyer edits `final_reply` and we run
    // `invalidatePdfCache`). The previous `immutable` directive caused
    // browsers to serve stale PDFs from local cache after invalidation.
    const etag = `"${result.binding.contentHash}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': 'private, max-age=0, must-revalidate' },
      });
    }
    const body = new Uint8Array(result.pdf.body);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(result.pdf.contentLength),
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
        ETag: etag,
      },
    });
  } catch (err) {
    if (err instanceof PdfNotFoundError) {
      return NextResponse.json(
        { success: false, message: 'PDF not found' },
        { status: 404 },
      );
    }
    logger.error(msg + 'render failed', { uuid, error: (err as Error).message });
    return NextResponse.json(
      { success: false, message: 'Не удалось сформировать PDF. Попробуйте позже.' },
      { status: 500 },
    );
  }
}
