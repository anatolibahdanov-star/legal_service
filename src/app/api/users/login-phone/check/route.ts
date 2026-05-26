import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { getUserByPhone } from '@/src/repositories/users/repo';

export const dynamic = 'force-dynamic';

// Lightweight existence check for the phone-login form. Returns
// {exists: boolean} so the UI can show "Указанный номер телефона не найден!"
// while the user is still typing — no SMS, no OTP, no captcha here. The
// information disclosed here is the same one /send-otp returns on failure
// (code: phone_not_found), so no new enumeration surface is added.
interface CheckBody {
  phone?: string;
}

export async function POST(request: NextRequest) {
  const msg = 'API login-phone/check - ';
  let body: CheckBody;
  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return NextResponse.json({ success: false, message: 'Некорректный запрос.' }, { status: 400 });
  }

  const phoneRaw = body.phone?.trim();
  if (!phoneRaw) {
    return NextResponse.json({ success: false, message: 'Номер телефона обязателен.' }, { status: 400 });
  }

  const normalized = normalizePhoneE164(phoneRaw);
  if (!normalized) {
    return NextResponse.json({ success: true, exists: false, phone: null }, { status: 200 });
  }

  const existing = await getUserByPhone(normalized.e164);
  const exists = !!existing;
  logger.info(msg + 'check', { phone_tail: normalized.digits.slice(-4), exists });

  return NextResponse.json({ success: true, exists, phone: normalized.e164 }, { status: 200 });
}
