import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getQuestionsByIds } from '@/src/repositories/requests/repo';
import { sendSms, normalizePhone } from '@/src/libs/p1sms';
import { triggerBackgroundGeneration } from '@/src/services/pdf';
import { getOrCreateShareUrl } from '@/src/services/pdf/shareLink';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-fA-F-]{32,36}$/;

interface SmsRequestBody {
  phone?: string;
}

/**
 * Sends the public PDF link to a phone number via SMS. Only the question's
 * owner can trigger this — the link itself is public, but we don't want a
 * leaked uuid to enable arbitrary outbound SMS.
 *
 * Triggering also kicks off PDF generation in the background so the recipient
 * doesn't see a "generating…" wait when they tap the link.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const msg = 'API pdf SMS - ';
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

  let body: SmsRequestBody;
  try {
    body = (await request.json()) as SmsRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Некорректный JSON.' },
      { status: 400 },
    );
  }
  const phoneE164 = body.phone ? normalizePhone(body.phone) : null;
  if (!phoneE164) {
    return NextResponse.json(
      { success: false, message: 'Некорректный номер телефона.' },
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

  const shareUrl = await getOrCreateShareUrl(Number(question.id), Number(question.user_id));
  if (!shareUrl) {
    return NextResponse.json(
      { success: false, message: 'Не удалось сформировать ссылку.' },
      { status: 500 },
    );
  }

  // Fixed copy per product spec. The whole payload stays under one Cyrillic
  // SMS segment for typical question_id/url lengths; p1sms logs a warn if it
  // splits across segments.
  const smsBody = `Enki.legal: PDF-документ по вашему обращению ${shareUrl}`;

  // Warm the cache so the link recipient doesn't see a cold-start delay.
  triggerBackgroundGeneration(uuid);

  const result = await sendSms({
    phone: phoneE164,
    body: smsBody,
    reference: `pdf_${question.id}_${Date.now()}`,
  });
  if (!result.success) {
    logger.error(msg + 'p1sms send failed', { uuid, error: result.error });
    return NextResponse.json(
      { success: false, message: result.error ?? 'Не удалось отправить SMS.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
