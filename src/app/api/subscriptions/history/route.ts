import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getSubscriptionHistory } from '@/src/repositories/subscriptions/repo';
import { SubscriptionHistoryItemI } from '@/src/interfaces/payment';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SUBSCRIPTION HISTORY ';

async function requireSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { ok: false as const, status: 401, message: 'Требуется авторизация.' };
    }
    if (!session.user.is_super) {
        return { ok: false as const, status: 403, message: 'Доступ запрещён.' };
    }
    return { ok: true as const, adminId: parseInt(session.user.id.toString(), 10) };
}

export async function GET(request: NextRequest) {
    const msg = cmnMsg + 'GET - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
        return NextResponse.json({ success: false, message: 'user_id is required.' }, { status: 400 });
    }

    try {
        const rows = await getSubscriptionHistory(userId);
        const items: SubscriptionHistoryItemI[] = rows.map((r) => ({
            id: r.id,
            createdAt: new Date(r.created_at as unknown as string).toISOString(),
            eventType: r.event_type,
            planName: r.plan_name ?? null,
            priceRub: r.price_rub ?? null,
            bvAmount: r.bv_amount ?? null,
            bvDelta: r.bv_delta ?? null,
            periodStart: r.period_start ? new Date(r.period_start as unknown as string).toISOString() : null,
            periodEnd: r.period_end ? new Date(r.period_end as unknown as string).toISOString() : null,
            statusAfter: r.status_after ?? null,
            comment: r.comment ?? null,
        }));
        return NextResponse.json({ items }, { status: 200 });
    } catch (err) {
        logger.error(msg + 'error during get data', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during get subscription history.' }, { status: 500 });
    }
}
