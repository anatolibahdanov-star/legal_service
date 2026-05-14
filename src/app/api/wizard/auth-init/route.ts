import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getUsersByIds } from '@/src/repositories/users/repo';
import { isFirstQuestionFree } from '@/src/services/firstQuestion';
import { getQuestionPrice } from '@/src/services/pricing';

export const dynamic = 'force-dynamic';

/**
 * Wizard init for an already-authenticated user. Returns the same shape the
 * OTP-verify endpoint returns for the new-user flow, so step 1 can decide
 * branching (free / pay-with-balance / payment step) without going through
 * phone/OTP/profile.
 */
export async function GET() {
  const msg = 'API wizard/auth-init - ';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, code: 'unauthorized', message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }

  const userId = session.user.id.toString();
  const user = await getUsersByIds([userId]);
  if (!user) {
    logger.warn(msg + 'session user not found in DB', { user_id: userId });
    return NextResponse.json(
      { success: false, code: 'user_not_found', message: 'Пользователь не найден.' },
      { status: 404 },
    );
  }

  const firstFree = await isFirstQuestionFree(userId);

  return NextResponse.json(
    {
      success: true,
      isFirstQuestionFree: firstFree,
      questionPrice: getQuestionPrice(),
      userBalance: user.balance ?? 0,
    },
    { status: 200 },
  );
}
