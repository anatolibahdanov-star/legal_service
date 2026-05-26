import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { verifyOtp, consumeVerifyToken } from '@/src/libs/otpStore';
import { resetByPhone } from '@/src/repositories/users/repo';
import {
  getPhoneStatus,
  recordFailedAttempt,
  resetAttempts,
  LOCKOUT_TRIGGER_ATTEMPTS,
} from '@/src/repositories/otp_attempts/repo';
import { sendSmsTemplate } from '@/src/libs/p1sms';
import { SmsTemplateE } from '@/src/interfaces/sms';

export const dynamic = 'force-dynamic';

const GENERIC_PHONE_ERROR = 'Введите корректный номер телефона.';
const COOLDOWN_MESSAGE = 'Слишком много попыток. Попробуйте через 5 минут.';
const LOCKOUT_MESSAGE = 'Слишком много попыток. Номер заблокирован на 24 часа.';
const SMS_FAILED = 'Не удалось отправить SMS с паролем. Попробуйте позже.';
const NOT_FOUND_MESSAGE = 'Аккаунт с таким номером не найден.';

interface VerifyOtpBody {
  phone?: string;
  code?: string;
}

const maskPhoneForUi = (e164: string): string => {
  // Mirror the visual masking convention used for email: keep the country
  // dialing prefix and the last 4 digits, hide the middle behind asterisks.
  if (e164.length < 5) return '*'.repeat(e164.length);
  const head = e164.startsWith('+') ? e164.slice(0, 2) : e164.slice(0, 1);
  const tail = e164.slice(-4);
  return `${head}${'*'.repeat(Math.max(0, e164.length - head.length - tail.length))}${tail}`;
};

export async function POST(request: NextRequest) {
  const msg = 'API reset-phone/verify-otp - ';
  let body: VerifyOtpBody;
  try {
    body = (await request.json()) as VerifyOtpBody;
  } catch {
    return NextResponse.json(
      { success: false, code: 'invalid_body', message: 'Некорректный запрос.' },
      { status: 400 },
    );
  }

  const phoneRaw = body.phone?.trim();
  const code = body.code?.trim();
  if (!phoneRaw || !code) {
    return NextResponse.json(
      { success: false, code: 'missing_fields', message: 'Укажите телефон и код.' },
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

  const phoneStatus = await getPhoneStatus(normalized.e164);
  if (phoneStatus.locked) {
    return NextResponse.json(
      {
        success: false,
        code: 'lockout_24h',
        message: LOCKOUT_MESSAGE,
        lockedUntil: phoneStatus.lockedUntil,
      },
      { status: 423 },
    );
  }
  if (phoneStatus.cooldown) {
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

  const result = verifyOtp(normalized.e164, code);
  if (!result.ok) {
    if (result.reason === 'invalid' || result.reason === 'expired') {
      const fail = await recordFailedAttempt(normalized.e164);
      if (fail.action === 'lock_24h') {
        return NextResponse.json(
          {
            success: false,
            code: 'lockout_24h',
            message: LOCKOUT_MESSAGE,
            lockedUntil: fail.lockedUntil,
          },
          { status: 423 },
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
      const message =
        result.reason === 'expired'
          ? 'Срок действия кода истёк. Запросите новый.'
          : 'Неверный код подтверждения.';
      return NextResponse.json(
        {
          success: false,
          code: result.reason,
          message,
          attemptsLeft: Math.max(0, LOCKOUT_TRIGGER_ATTEMPTS - fail.attempts),
        },
        { status: result.reason === 'expired' ? 410 : 400 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: 'not_found',
        message: 'Код не запрошен или уже использован.',
      },
      { status: 410 },
    );
  }

  // The reset flow does NOT sign the user in — the verify token is consumed
  // here purely to invalidate it so it can't be replayed elsewhere.
  consumeVerifyToken(normalized.e164, result.verifyToken);
  await resetAttempts(normalized.e164);

  const user = await resetByPhone(normalized.e164);
  if (!user) {
    logger.error(msg + 'user vanished or temp password write failed', {
      phone_tail: normalized.digits.slice(-4),
    });
    return NextResponse.json(
      { success: false, code: 'phone_not_found', message: NOT_FOUND_MESSAGE },
      { status: 404 },
    );
  }

  const sms = await sendSmsTemplate({
    phone: normalized.e164,
    template: SmsTemplateE.ResetPassword,
    params: { password: user.password },
    reference: `reset_pwd_${Date.now()}`,
  });
  if (!sms.success) {
    logger.error(msg + 'SMS with new password failed', {
      phone_tail: normalized.digits.slice(-4),
    });
    return NextResponse.json(
      { success: false, code: 'sms_failed', message: sms.error ?? SMS_FAILED },
      { status: 502 },
    );
  }

  logger.info(msg + 'temp password sent via SMS', {
    user_id: user.id,
    phone_tail: normalized.digits.slice(-4),
  });

  return NextResponse.json(
    {
      success: true,
      phone: normalized.e164,
      maskedPhone: maskPhoneForUi(normalized.e164),
    },
    { status: 200 },
  );
}
