import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { format } from 'date-fns';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getQuestionsByIds } from '@/src/repositories/requests/repo';
import { getOrGeneratePdf } from '@/src/services/pdf';
import { SendSendGridPdfAttachment } from '@/src/libs/sendgrid';
import { dFormat } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-fA-F-]{32,36}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailRequestBody {
  email?: string;
}

/**
 * Sends the lawyer's PDF answer to the user-supplied address as an attachment.
 *
 * Flow:
 *  1. AuthZ: only the question's owner may trigger the send.
 *  2. Validate recipient email.
 *  3. Pull PDF via the cache-aware service — File Storage hit or regeneration
 *     via Quarkdown if missing.
 *  4. Hand off to the SendGrid helper with the agreed copy.
 *
 * Distinct error codes per failure mode (400 input, 401 auth, 403 owner-only,
 * 404 missing question, 500 PDF render, 502 SendGrid) so the UI can show a
 * meaningful message.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const msg = 'API pdf email - ';
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

  let body: EmailRequestBody;
  try {
    body = (await request.json()) as EmailRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Некорректный JSON.' },
      { status: 400 },
    );
  }
  const recipient = (body.email ?? '').trim();
  if (!EMAIL_RE.test(recipient)) {
    return NextResponse.json(
      { success: false, message: 'Некорректный email.' },
      { status: 400 },
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

  let pdfBytes: Uint8Array;
  try {
    const result = await getOrGeneratePdf(uuid);
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'PDF не найден.' },
        { status: 404 },
      );
    }
    pdfBytes = result.pdf.body;
    logger.info(msg + 'pdf ready', {
      uuid,
      question_id: question.id,
      generated: result.generated,
      bytes: pdfBytes.byteLength,
    });
  } catch (err) {
    logger.error(msg + 'pdf generation failed', {
      uuid,
      question_id: question.id,
      error: (err as Error).message,
    });
    return NextResponse.json(
      { success: false, message: 'Не удалось сформировать PDF.' },
      { status: 500 },
    );
  }

  const issuedAt = (() => {
    try {
      return format(new Date(question.created_at as unknown as string), dFormat);
    } catch {
      return '';
    }
  })();

  const ok = await SendSendGridPdfAttachment({
    recipient,
    question_id: question.id,
    question_subject: question.category_name ?? '',
    question_date: issuedAt,
    pdf: pdfBytes,
    filename: `enki-answer-${question.id}.pdf`,
  });

  if (!ok) {
    return NextResponse.json(
      { success: false, message: 'Не удалось отправить email.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
