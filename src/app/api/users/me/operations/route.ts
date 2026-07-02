import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { AdminBalanceOperationI, AdminOperationTypeE } from '@/src/interfaces/payment';
import { getAdminUserOperations } from '@/src/services/adminOperations';

export const dynamic = 'force-dynamic';

const msgGlobal = 'API users/me/operations - ';

const allowedTypes = new Set<string>([...Object.values(AdminOperationTypeE), 'free']);

/**
 * Скрываем от клиента, какой именно администратор провёл операцию —
 * для пользователя достаточно нейтрального «Администратор».
 */
const sanitizeActor = (actor: string): string =>
  actor.startsWith('Admin (') ? 'Администратор' : actor;

/**
 * История операций текущего пользователя: платежи, списания, ручные
 * корректировки и операции с бесплатными вопросами — тот же набор, что
 * видит администратор, но строго в рамках session.user.id (client-supplied
 * user_id не принимается).
 */
export async function GET(request: NextRequest) {
  const msg = msgGlobal;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 });
  }
  if (session.user.role !== 'user') {
    return NextResponse.json(
      { success: false, message: 'История операций доступна только пользователям.' },
      { status: 403 },
    );
  }

  const rawType = request.nextUrl.searchParams.get('type') ?? 'all';
  const type = allowedTypes.has(rawType) ? (rawType as AdminOperationTypeE | 'free') : 'all';

  try {
    const operations = await getAdminUserOperations(session.user.id.toString(), type);
    const items: AdminBalanceOperationI[] = operations.map((op) => ({
      ...op,
      actor: sanitizeActor(op.actor),
    }));
    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    logger.error(msg + 'error during get operations', (err as Error).message);
    return NextResponse.json(
      { success: false, message: 'Не удалось загрузить историю операций.' },
      { status: 500 },
    );
  }
}
