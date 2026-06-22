import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { verifyOtp } from '@/src/libs/otpStore';
import { getUserByPhone, updateUserPhone } from '@/src/repositories/users/repo';
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
  const msg = 'API change-phone/verify-otp - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }
  const userId = session.user.id.toString();

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

  const existing = await getUserByPhone(normalized.e164);
  if (existing && existing.id?.toString() !== userId) {
    logger.warn(msg + 'race: phone taken between send and verify', {
      phone_tail: normalized.digits.slice(-4),
    });
    return NextResponse.json(
      {
        success: false,
        code: 'phone_taken',
        message: 'Этот номер телефона уже используется другим пользователем.',
      },
      { status: 409 },
    );
  }

  if (!existing) {
    const updated = await updateUserPhone(userId, normalized.e164);
    if (!updated) {
      logger.error(msg + 'failed to update phone', {
        user_id: userId,
        phone_tail: normalized.digits.slice(-4),
      });
      return NextResponse.json(
        {
          success: false,
          code: 'update_failed',
          message: 'Не удалось сменить номер. Попробуйте позже.',
        },
        { status: 500 },
      );
    }
  }

  logger.info(msg + 'phone changed via OTP', {
    user_id: userId,
    phone_tail: normalized.digits.slice(-4),
  });

  return NextResponse.json(
    { success: true, phone: normalized.e164 },
    { status: 200 },
  );
}
