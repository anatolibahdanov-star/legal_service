import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { verifyRecaptcha } from '@/src/libs/recaptcha';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { createOtp, invalidateOtp } from '@/src/libs/otpStore';
import { getUserByPhone } from '@/src/repositories/users/repo';
import { getPhoneStatus, recordFailedAttempt } from '@/src/repositories/otp_attempts/repo';
import { sendSmsTemplate, isDryRun } from '@/src/libs/p1sms';
import { SmsTemplateE } from '@/src/interfaces/sms';
import { UserStatusesE } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic';

const COOLDOWN_MESSAGE = 'Слишком много попыток. Попробуйте через 5 минут.';
const LOCKOUT_MESSAGE = 'Слишком много попыток. Номер заблокирован на 24 часа.';
const BLOCKED_MESSAGE = 'Ваш номер телефона заблокирован. Свяжитесь с тех.поддержкой.';
const GENERIC_PHONE_ERROR = 'Введите корректный номер телефона.';

interface SendOtpBody {
  phone?: string;
  captchaToken?: string;
}

/**
 * Unified send-otp for the question wizard. Internally figures out whether
 * the phone is new (register branch) or existing (login branch) and runs
 * the appropriate checks — but to the client it's one request, one response.
 *
 * Replaces the previous "try register-phone, fall back to login-phone on
 * phone_exists" dance, which created a confusing red 409 in DevTools every
 * time an existing user reused the wizard.
 *
 * Response always includes `isLogin: boolean` so the client can later
 * pick the right verify-otp branch.
 */
export async function POST(request: NextRequest) {
  const msg = 'API wizard/send-otp - ';
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
  const captcha = await verifyRecaptcha(captchaToken, ip, { expectedAction: 'wizard_phone_otp' });
  if (!captcha.success) {
    logger.warn(msg + 'captcha failed', { reason: captcha.reason });
    return NextResponse.json(
      {
        success: false,
        code: 'captcha_failed',
        message: 'Не удалось пройти проверку CAPTCHA. Попробуйте снова.',
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

  // Decide branch: existing user (login flow) or brand-new phone (register flow).
  const existing = await getUserByPhone(normalized.e164);
  const isLogin = !!existing;

  // For existing users: respect admin-ban.
  if (existing && existing.status !== undefined && existing.status !== UserStatusesE.Activated) {
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

  // Common: respect attempt-based locks/cooldowns.
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
        message: LOCKOUT_MESSAGE,
        lockedUntil: phoneStatus.lockedUntil,
      },
      { status: 403 },
    );
  }
  if (phoneStatus.cooldown) {
    logger.warn(msg + 'phone in cooldown', {
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
  if (!result.ok) {
    // Existing OTP is still valid (resend cooldown). Count this repeat as a
    // failed attempt so spam-clicking gets escalated to cooldown / lockout.
    const fail = await recordFailedAttempt(normalized.e164);
    logger.info(msg + 'repeat send-otp counted as attempt', {
      phone_tail: normalized.digits.slice(-4),
      attempts: fail.attempts,
      action: fail.action,
    });
    if (fail.action === 'lock_24h') {
      return NextResponse.json(
        {
          success: false,
          code: 'phone_blocked',
          message: LOCKOUT_MESSAGE,
          lockedUntil: fail.lockedUntil,
        },
        { status: 403 },
      );
    }
    if (fail.action === 'cooldown_5min') {
      return NextResponse.json(
        {
          success: false,
          code: 'cooldown_5min',
          message: COOLDOWN_MESSAGE,
          cooldownUntil: fail.cooldownUntil,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: 'cooldown',
        message: `Подождите ${result.retryAfterSec} сек. перед повторной отправкой.`,
        retryAfterSec: result.retryAfterSec,
      },
      { status: 429 },
    );
  }

  logger.info(msg + 'OTP issued', {
    phone_tail: normalized.digits.slice(-4),
    code: result.code,
    is_login: isLogin,
  });

  const sms = await sendSmsTemplate({
    phone: normalized.e164,
    template: SmsTemplateE.OtpCode,
    params: { code: result.code },
    reference: `wizard_${Date.now()}`,
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
      isLogin,
      ...(isDryRun() ? { devCode: result.code } : {}),
    },
    { status: 200 },
  );
}
