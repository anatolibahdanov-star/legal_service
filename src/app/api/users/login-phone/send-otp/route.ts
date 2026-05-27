import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { verifyCaptcha } from '@/src/libs/captcha';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { createOtp, invalidateOtp } from '@/src/libs/otpStore';
import { getUserByPhone } from '@/src/repositories/users/repo';
import { getPhoneStatus } from '@/src/repositories/otp_attempts/repo';
import { sendSmsTemplate, isDryRun } from '@/src/libs/p1sms';
import { SmsTemplateE } from '@/src/interfaces/sms';
import { UserStatusesE } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic';

const GENERIC_PHONE_ERROR = 'Введите корректный номер телефона.';
const BLOCKED_MESSAGE = 'Ваш номер телефона заблокирован. Свяжитесь с тех.поддержкой.';
const COOLDOWN_MESSAGE = 'Слишком много попыток. Попробуйте через 5 минут.';

interface SendOtpBody {
  phone?: string;
  captchaToken?: string;
}

export async function POST(request: NextRequest) {
  const msg = 'API login-phone/send-otp - ';
  let body: SendOtpBody;
  try {
    body = (await request.json()) as SendOtpBody;
  } catch {
    return NextResponse.json(
      { success: false, code: 'invalid_body', message: 'Некорректный запрос.' },
      { status: 400 },
    );
  }

  const phoneRaw = body.phone?.trim();
  const captchaToken = body.captchaToken?.trim();

  if (!phoneRaw) {
    return NextResponse.json(
      { success: false, code: 'phone_required', message: GENERIC_PHONE_ERROR },
      { status: 400 },
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const captcha = await verifyCaptcha(captchaToken, ip);
  if (!captcha.success) {
    logger.warn(msg + 'captcha failed', { reason: captcha.reason });
    return NextResponse.json(
      {
        success: false,
        code: 'captcha_failed',
        message: 'CAPTCHA введена не верно.',
      },
      { status: 400 },
    );
  }

  const normalized = normalizePhoneE164(phoneRaw);
  if (!normalized) {
    return NextResponse.json(
      { success: false, code: 'invalid_phone', message: GENERIC_PHONE_ERROR },
      { status: 400 },
    );
  }

  const existing = await getUserByPhone(normalized.e164);
  if (!existing) {
    logger.info(msg + 'phone not registered', { phone_tail: normalized.digits.slice(-4) });
    return NextResponse.json(
      { success: false, code: 'phone_not_found', message: GENERIC_PHONE_ERROR },
      { status: 400 },
    );
  }

  if (existing.status !== undefined && existing.status !== UserStatusesE.Activated) {
    logger.warn(msg + 'user banned', {
      user_id: existing.id,
      phone_tail: normalized.digits.slice(-4),
      status: existing.status,
    });
    return NextResponse.json(
      { success: false, code: 'phone_blocked', message: BLOCKED_MESSAGE },
      { status: 403 },
    );
  }

  const phoneStatus = await getPhoneStatus(normalized.e164);
  if (phoneStatus.locked) {
    logger.warn(msg + 'phone temporarily locked', {
      phone_tail: normalized.digits.slice(-4),
      remaining_sec: phoneStatus.lockedRemainingSec,
    });
    return NextResponse.json(
      {
        success: false,
        code: 'phone_blocked',
        message: BLOCKED_MESSAGE,
        lockedUntil: phoneStatus.lockedUntil,
      },
      { status: 403 },
    );
  }
  if (phoneStatus.cooldown) {
    logger.warn(msg + 'phone in cooldown, rejecting send-otp', {
      phone_tail: normalized.digits.slice(-4),
      remaining_sec: phoneStatus.cooldownRemainingSec,
    });
    return NextResponse.json(
      {
        success: false,
        code: 'cooldown_5min',
        message: COOLDOWN_MESSAGE,
        cooldownUntil: phoneStatus.cooldownUntil,
        retryAfterSec: phoneStatus.cooldownRemainingSec,
      },
      { status: 429 },
    );
  }

  const result = createOtp(normalized.e164);

  logger.info(msg + 'OTP issued', {
    phone_tail: normalized.digits.slice(-4),
    code: result.code,
  });

  const sms = await sendSmsTemplate({
    phone: normalized.e164,
    template: SmsTemplateE.OtpCode,
    params: { code: result.code },
    reference: `login_${Date.now()}`,
  });
  if (!sms.success) {
    invalidateOtp(normalized.e164);
    logger.error(msg + 'SMS send failed', { phone_tail: normalized.digits.slice(-4) });
    return NextResponse.json(
      {
        success: false,
        code: 'sms_failed',
        message: sms.error ?? 'Не удалось отправить SMS. Попробуйте позже.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      phone: normalized.e164,
      expiresInSec: result.expiresInSec,
      ...(isDryRun() ? { devCode: result.code } : {}),
    },
    { status: 200 },
  );
}
