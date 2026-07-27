import { NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { getActivePlans } from '@/src/repositories/subscriptions/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const plans = await getActivePlans();
        const items = plans.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price_rub: p.price_rub,
            bv_amount: p.bv_amount,
            tone: p.tone,
            badge: p.badge,
            featured: p.featured === 1,
        }));
        const response = NextResponse.json({ plans: items }, { status: 200 });
        response.headers.set('Cache-Control', 'no-store');
        return response;
    } catch (err) {
        logger.error('API SUBSCRIPTIONS PUBLIC GET - ', (err as Error).message);
        return NextResponse.json({ plans: [] }, { status: 200 });
    }
}
