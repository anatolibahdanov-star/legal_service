import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { verifyOtp } from '@/src/libs/otpStore';
import { getUserByPhone } from '@/src/repositories/users/repo';
import {
  getPhoneStatus,
  recordFailedAttempt,
  resetAttempts,
} from '@/src/repositories/otp_attempts/repo';
import { isFirstQuestionFree } from '@/src/services/firstQuestion';
import { getQuestionPrice } from '@/src/services/pricing';

export const dynamic = 'force-dynamic';

const GENERIC_PHONE_ERROR = 'Введите корректный номер телефона.';
const COOLDOWN_MESSAGE = 'Слишком много попыток. Попробуйте через 5 минут.';
const LOCKOUT_MESSAGE = 'Слишком много попыток. Номер заблокирован на 24 часа.';

interface VerifyOtpBody {
  phone?: string;
  code?: string;
}

/**
 * Unified verify-otp for the question wizard.
 * Never creates a user — that's the wizard contract. After successful
 * verification:
 *   - existing user → return { user, isLogin: true }
 *   - new phone     → return { user: null, isLogin: false }
 * Either way the caller (request.tsx) decides whether to show the profile
 * step or skip it, and either signs in (existing) or calls complete-profile
 * (new) which creates the user with real name+email.
 *
 * Returns the same enriched payload the previous register/login verify-otp
 * endpoints returned (verifyToken, isFirstQuestionFree, questionPrice, userBalance)
 * so the wizard's downstream logic stays unchanged.
 */
export async function POST(request: NextRequest) {
  const msg = 'API wizard/verify-otp - ';
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

  const result = verifyOtp(normalized.e164, code);
  if (!result.ok) {
    // The counter grows on wrong/expired codes; not_found is silent.
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
          attemptsLeft: fail.attemptsLeft,
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
  const isLogin = !!existing;
  const firstFree = await isFirstQuestionFree(existing?.id ?? null);

  logger.info(msg + 'OTP verified', {
    phone_tail: normalized.digits.slice(-4),
    is_login: isLogin,
    user_id: existing?.id,
    first_question_free: firstFree,
  });

  return NextResponse.json(
    {
      success: true,
      phone: normalized.e164,
      verifyToken: result.verifyToken,
      user: existing ? { id: existing.id, name: existing.name, email: existing.email } : null,
      isLogin,
      isFirstQuestionFree: firstFree,
      questionPrice: getQuestionPrice(),
      userBalance: existing?.balance ?? 0,
    },
    { status: 200 },
  );
}
