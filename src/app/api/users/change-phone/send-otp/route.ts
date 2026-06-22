import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { verifyCaptcha } from '@/src/libs/captcha';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { createOtp, invalidateOtp } from '@/src/libs/otpStore';
import { getUserByPhone } from '@/src/repositories/users/repo';
import { getPhoneStatus } from '@/src/repositories/otp_attempts/repo';
import { sendSmsTemplate, isDryRun } from '@/src/libs/p1sms';
import { SmsTemplateE } from '@/src/interfaces/sms';

export const dynamic = 'force-dynamic';

const COOLDOWN_MESSAGE = 'Слишком много попыток. Попробуйте через 5 минут.';
const BLOCKED_MESSAGE = 'Ваш номер телефона заблокирован. Свяжитесь с тех.поддержкой.';

interface SendOtpBody {
  phone?: string;
  captchaToken?: string;
}

export async function POST(request: NextRequest) {
  const msg = 'API change-phone/send-otp - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }
  const userId = session.user.id.toString();

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
      { success: false, code: 'phone_required', message: 'Укажите номер телефона.' },
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
        message: 'Не удалось пройти проверку CAPTCHA. Попробуйте снова.',
      },
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

  const existing = await getUserByPhone(normalized.e164);
  if (existing && existing.id?.toString() === userId) {
    return NextResponse.json(
      {
        success: false,
        code: 'phone_same',
        message: 'Этот номер уже привязан к вашему аккаунту.',
      },
      { status: 409 },
    );
  }
  if (existing) {
    return NextResponse.json(
      {
        success: false,
        code: 'phone_taken',
        message: 'Этот номер телефона уже используется другим пользователем.',
      },
      { status: 409 },
    );
  }

  const phoneStatus = await getPhoneStatus(normalized.e164);
  if (phoneStatus.locked) {
    logger.warn(msg + 'phone locked, rejecting send-otp', {
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
    user_id: userId,
    phone_tail: normalized.digits.slice(-4),
  });

  const sms = await sendSmsTemplate({
    phone: normalized.e164,
    template: SmsTemplateE.OtpCode,
    params: { code: result.code },
    reference: `change_${Date.now()}`,
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
