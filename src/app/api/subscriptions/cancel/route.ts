import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { cancelSubscription } from '@/src/services/subscription';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SUBSCRIPTION CANCEL ';

export async function POST() {
    const msg = cmnMsg + 'POST - ';
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 });
    }

    try {
        const result = await cancelSubscription(session.user.id);
        if (!result.ok) {
            return NextResponse.json({ success: false, message: result.error ?? 'Не удалось отменить подписку.' }, { status: 400 });
        }
        return NextResponse.json({ success: true, periodEnd: result.periodEnd }, { status: 200 });
    } catch (err) {
        logger.error(msg + 'error during cancel', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during cancel subscription.' }, { status: 500 });
    }
}
