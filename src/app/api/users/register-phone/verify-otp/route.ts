import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import {
  normalizePhoneE164,
  phoneToEmail,
  phoneToDefaultName,
  generatePassword,
} from '@/src/libs/phoneIdentity';
import { verifyOtp } from '@/src/libs/otpStore';
import { register } from '@/src/repositories/users/repo';
import {
  getPhoneStatus,
  recordFailedAttempt,
  resetAttempts,
  LOCKOUT_TRIGGER_ATTEMPTS,
} from '@/src/repositories/otp_attempts/repo';

export const dynamic = 'force-dynamic';

const COOLDOWN_MESSAGE = 'Слишком много попыток. Попробуйте через 5 минут.';
const LOCKOUT_MESSAGE = 'Слишком много попыток. Номер заблокирован на 24 часа.';

interface VerifyOtpBody {
  phone?: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  const msg = 'API register-phone/verify-otp - ';
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
      { success: false, code: 'invalid_phone', message: 'Некорректный номер телефона.' },
      { status: 400 },
    );
  }

  const phoneStatus = await getPhoneStatus(normalized.e164);
  if (phoneStatus.locked) {
    logger.warn(msg + 'phone locked, rejecting', {
      phone_tail: normalized.digits.slice(-4),
      remaining_sec: phoneStatus.lockedRemainingSec,
    });
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
    logger.warn(msg + 'phone in cooldown, rejecting', {
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

  const result = verifyOtp(normalized.e164, code);
  if (!result.ok) {
    // Per BPMN, the counter grows on both wrong and expired codes.
    // not_found — not counted (OTP was not requested or already used).
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

  await resetAttempts(normalized.e164);

  const email = phoneToEmail(normalized.e164);
  const password = generatePassword();
  const name = phoneToDefaultName(normalized.e164);

  const user = await register(name, email, password, normalized.e164);
  if (user === undefined) {
    logger.warn(msg + 'race: user appeared between send and verify', {
      phone_tail: normalized.digits.slice(-4),
    });
    return NextResponse.json(
      {
        success: false,
        code: 'phone_exists',
        message: 'Пользователь с таким номером уже зарегистрирован.',
      },
      { status: 409 },
    );
  }
  if (user === null) {
    logger.error(msg + 'failed to create user', { phone_tail: normalized.digits.slice(-4) });
    return NextResponse.json(
      {
        success: false,
        code: 'create_failed',
        message: 'Технические неполадки. Попробуйте повторить через 3 минуты.',
      },
      { status: 500 },
    );
  }

  logger.info(msg + 'user registered via OTP', {
    user_id: user.id,
    phone_tail: normalized.digits.slice(-4),
  });

  return NextResponse.json(
    {
      success: true,
      phone: normalized.e164,
      verifyToken: result.verifyToken,
      user: { id: user.id, name: user.name, email: user.email },
    },
    { status: 200 },
  );
}
