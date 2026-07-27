import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getActiveSubscriptionByUser, getPlanById } from '@/src/repositories/subscriptions/repo';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SUBSCRIPTION ME ';

export async function GET() {
    const msg = cmnMsg + 'GET - ';
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 });
    }

    try {
        const sub = await getActiveSubscriptionByUser(session.user.id);
        if (!sub) {
            return NextResponse.json({ subscription: null }, { status: 200 });
        }
        const plan = sub.plan_id ? await getPlanById(sub.plan_id) : null;
        return NextResponse.json({
            subscription: {
                id: sub.id,
                status: sub.status,
                planId: sub.plan_id,
                planName: plan?.name ?? null,
                priceRub: sub.price_rub,
                bvAmount: sub.bv_amount,
                periodStart: sub.period_start ? new Date(sub.period_start as unknown as string).toISOString() : null,
                periodEnd: sub.period_end ? new Date(sub.period_end as unknown as string).toISOString() : null,
                willRenew: sub.next_charge_at !== null && sub.binding_id !== null,
            },
        }, { status: 200 });
    } catch (err) {
        logger.error(msg + 'error during get', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during get subscription.' }, { status: 500 });
    }
}
