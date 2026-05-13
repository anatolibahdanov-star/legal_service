import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import {
  updateUserProfileFields,
  createUserFromWizard,
  getUserByPhone,
  getUsersByIds,
} from '@/src/repositories/users/repo';
import { normalizePhoneE164 } from '@/src/libs/phoneIdentity';
import { peekVerifyToken } from '@/src/libs/otpStore';
import { isFirstQuestionFree } from '@/src/services/firstQuestion';
import { getQuestionPrice } from '@/src/services/pricing';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MIN_LENGTH = 2;

interface CompleteProfileBody {
  name?: string;
  email?: string;
  /** Wizard flow: when there's no session yet, identify the user by their
   *  freshly-verified phone + the verifyToken issued by verify-otp. */
  phone?: string;
  verifyToken?: string;
}

export async function POST(request: NextRequest) {
  const msg = 'API users/complete-profile - ';

  let body: CompleteProfileBody;
  try {
    body = (await request.json()) as CompleteProfileBody;
  } catch {
    return NextResponse.json(
      { success: false, code: 'invalid_body', message: 'Некорректный запрос.' },
      { status: 400 },
    );
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();

  if (name.length > 0 && name.length < NAME_MIN_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        code: 'invalid_name',
        message: `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа.`,
      },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        code: 'email_required',
        message: 'Email необходим для получения ответа от юриста',
      },
      { status: 400 },
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      {
        success: false,
        code: 'invalid_email',
        message: 'Введите корректный email.',
      },
      { status: 400 },
    );
  }

  // Two ways to authorize the call:
  //   1) NextAuth session (signed-in user updating their existing profile)
  //   2) Wizard: phone + verifyToken (user just verified phone in the wizard;
  //      may or may not exist in the DB yet)
  const session = await getServerSession(authOptions);
  let phoneE164: string | null = null;

  if (body.phone && body.verifyToken) {
    const normalized = normalizePhoneE164(body.phone);
    if (!normalized) {
      return NextResponse.json(
        { success: false, code: 'invalid_phone', message: 'Некорректный номер телефона.' },
        { status: 400 },
      );
    }
    if (!peekVerifyToken(normalized.e164, body.verifyToken)) {
      logger.warn(msg + 'wizard token rejected', { phone_tail: normalized.digits.slice(-4) });
      return NextResponse.json(
        { success: false, code: 'unauthorized', message: 'Сессия подтверждения истекла.' },
        { status: 401 },
      );
    }
    phoneE164 = normalized.e164;
  } else if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  // Update existing user or create a new one (wizard flow for a phone that
  // wasn't in the DB yet).
  const finalName = name.length >= NAME_MIN_LENGTH ? name : '';
  let userId: string | null = null;
  let resultUser: { id: string; name: string; email: string } | null = null;

  // Resolve target user.
  if (session?.user?.id) {
    userId = session.user.id.toString();
  } else if (phoneE164) {
    const existing = await getUserByPhone(phoneE164);
    if (existing) {
      userId = existing.id.toString();
    }
  }

  if (userId) {
    const updated = await updateUserProfileFields(userId, finalName || name, email);
    if (updated === undefined) {
      return NextResponse.json(
        { success: false, code: 'email_taken', message: 'Этот email уже используется другим пользователем.' },
        { status: 409 },
      );
    }
    if (updated === null) {
      logger.error(msg + 'update failed', { user_id: userId });
      return NextResponse.json(
        { success: false, code: 'update_failed', message: 'Не удалось сохранить профиль. Попробуйте позже.' },
        { status: 500 },
      );
    }
    resultUser = { id: updated.id, name: updated.name, email: updated.email };
  } else if (phoneE164) {
    // Brand-new user from the wizard — create the record now.
    const created = await createUserFromWizard(phoneE164, finalName, email);
    if (created === undefined) {
      return NextResponse.json(
        { success: false, code: 'email_taken', message: 'Этот email уже используется другим пользователем.' },
        { status: 409 },
      );
    }
    if (!created) {
      logger.error(msg + 'create failed', { phone_tail: phoneE164.slice(-4) });
      return NextResponse.json(
        { success: false, code: 'create_failed', message: 'Не удалось создать профиль. Попробуйте позже.' },
        { status: 500 },
      );
    }
    resultUser = { id: created.id, name: created.name, email: created.email };
  } else {
    // Shouldn't reach here due to the unauthorized guard above.
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  // TODO: real email verification (stub for now — see task 3 scope).
  logger.info(msg + 'STUB email verification — would send', {
    user_id: resultUser.id,
    email: resultUser.email,
  });

  const firstFree = await isFirstQuestionFree(resultUser.id);
  const userRecord = await getUsersByIds([resultUser.id.toString()]);

  return NextResponse.json(
    {
      success: true,
      user: resultUser,
      verificationEmailSent: true,
      isFirstQuestionFree: firstFree,
      questionPrice: getQuestionPrice(),
      userBalance: userRecord?.balance ?? 0,
    },
    { status: 200 },
  );
}
