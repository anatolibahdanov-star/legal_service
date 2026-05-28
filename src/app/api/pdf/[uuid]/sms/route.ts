import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getQuestionByShortId, getQuestionsByIds } from '@/src/repositories/requests/repo';
import { sendSms, normalizePhone } from '@/src/libs/p1sms';
import { triggerBackgroundGeneration } from '@/src/services/pdf';
import { PDF_ID_REGEX, isShortId } from '@/src/services/pdf/shortId';

export const dynamic = 'force-dynamic';

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
  if (!PDF_ID_REGEX.test(uuid)) {
    return NextResponse.json(
      { success: false, message: 'Invalid id' },
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

  const question = isShortId(uuid)
    ? await getQuestionByShortId(uuid)
    : (await getQuestionsByIds([uuid], false))?.[0] ?? null;
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

  // Send the canonical short PDF URL (e.g. /api/pdf/AbCd). It's a few chars
  // instead of a 64-char share token, which keeps the SMS under one Cyrillic
  // segment with room to spare. If the question somehow has no short_id yet
  // (legacy row that escaped lazy backfill), fall back to the uuid.
  const base = (process.env.NEXT_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/+$/, '');
  const pdfId = question.short_id ?? question.uuid;
  const shareUrl = `${base}/api/pdf/${pdfId}`;

  // Fixed copy per product spec.
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
