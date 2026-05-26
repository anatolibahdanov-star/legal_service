import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { getShareLinkByToken } from '@/src/repositories/pdf_share_links/repo';
import { getQuestionsByIds } from '@/src/repositories/requests/repo';
import { getOrGeneratePdf } from '@/src/services/pdf';

export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[1-9][0-9]*$/;

/**
 * Public, non-expiring share endpoint that streams the PDF.
 *
 * URL: /api/pdf/share/<question_id>/<token>
 *
 * The token is a 64-char random hex value stored in `pdf_share_link.token`,
 * uniquely indexed. The path `id` is the question id — it's checked against
 * the token's stored question_id for spec compliance ("ссылка содержит PDF ID
 * и token"); a token alone would be sufficient security-wise.
 *
 *   GET /api/pdf/share/<id>/<token>             → inline preview
 *   GET /api/pdf/share/<id>/<token>?download=1  → forces "Save as…"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; token: string }> },
) {
  const msg = 'API pdf share GET - ';
  const { id, token } = await params;

  if (!ID_RE.test(id) || !TOKEN_RE.test(token)) {
    return NextResponse.json(
      { success: false, message: 'Invalid share link' },
      { status: 400 },
    );
  }

  const link = await getShareLinkByToken(token);
  if (!link || link.revoked) {
    logger.warn(msg + 'invalid or revoked token', { id });
    return NextResponse.json(
      { success: false, message: 'Ссылка недействительна.' },
      { status: 404 },
    );
  }
  if (String(link.question_id) !== id) {
    // Token exists but for a different question — treat as invalid; somebody
    // is probing the URL surface.
    logger.warn(msg + 'token/question_id mismatch', {
      url_id: id,
      token_question_id: link.question_id,
    });
    return NextResponse.json(
      { success: false, message: 'Ссылка недействительна.' },
      { status: 404 },
    );
  }

  // Translate question_id → uuid for the existing PDF service (keyed by uuid).
  const rows = await getQuestionsByIds([String(link.question_id)], true);
  const question = rows?.[0];
  if (!question) {
    logger.error(msg + 'token resolved but question gone', { question_id: link.question_id });
    return NextResponse.json(
      { success: false, message: 'Вопрос не найден.' },
      { status: 404 },
    );
  }

  try {
    const result = await getOrGeneratePdf(question.uuid);
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'PDF не найден.' },
        { status: 404 },
      );
    }
    const download = request.nextUrl.searchParams.get('download') === '1';
    const filename = `enki-answer-${question.id}.pdf`;
    const disposition = download ? 'attachment' : 'inline';
    // ETag-based revalidation — see /api/pdf/[uuid]/route.ts for the rationale.
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
    logger.error(msg + 'pdf render/stream failed', {
      question_id: link.question_id,
      error: (err as Error).message,
    });
    return NextResponse.json(
      { success: false, message: 'Не удалось получить PDF.' },
      { status: 500 },
    );
  }
}
