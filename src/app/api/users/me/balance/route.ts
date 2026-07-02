import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getUsersByIds } from '@/src/repositories/users/repo';

export const dynamic = 'force-dynamic';

/**
 * Returns the authenticated user's current balance (in rubles).
 * Used by the header balance widget for the signed-in state.
 */
export async function GET() {
  const msg = 'API users/me/balance - ';
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }
  if (session.user.role !== 'user') {
    return NextResponse.json(
      { success: false, message: 'Баланс доступен только пользователям.' },
      { status: 403 },
    );
  }

  const user = await getUsersByIds([session.user.id.toString()]);
  if (!user) {
    logger.warn(msg + 'session user not found in DB', { user_id: session.user.id });
    return NextResponse.json(
      { success: false, message: 'Пользователь не найден.' },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { success: true, balance: user.balance ?? 0, freeQuestions: user.free_questions ?? 0 },
    { status: 200 },
  );
}
