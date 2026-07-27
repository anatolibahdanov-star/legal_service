import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getPlanById, savePlan, deletePlan } from '@/src/repositories/subscriptions/repo';
import { DBSubscriptionPlan } from '@/src/interfaces/db';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SUBSCRIPTION ';

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

const idFromUrl = (url: string): string => url.split('/api/subscriptions/')[1]?.split('?')[0];

export async function GET(request: NextRequest) {
    const msg = cmnMsg + 'GET - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const id = idFromUrl(request.url);
    let plan: DBSubscriptionPlan | null = null;
    try {
        plan = await getPlanById(id);
    } catch (err) {
        logger.error(msg + 'error during get data.', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during get data.' }, { status: 500 });
    }
    if (!plan) {
        return NextResponse.json({ success: false, message: 'Тариф не найден.' }, { status: 404 });
    }
    const response = NextResponse.json(plan, { status: 200 });
    response.headers.set('X-Total-Count', '1');
    response.headers.set('Cache-Control', 'no-store');
    return response;
}

export async function PUT(request: NextRequest) {
    const msg = cmnMsg + 'PUT - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const id = idFromUrl(request.url);
    const body: Partial<DBSubscriptionPlan> = await request.json();
    try {
        const result = await savePlan(id, body);
        if (!result.plan) {
            return NextResponse.json({ success: false, message: result.error ?? 'Не удалось сохранить.' }, { status: 400 });
        }
        const response = NextResponse.json(result.plan, { status: 200 });
        response.headers.set('X-Total-Count', '1');
        return response;
    } catch (err) {
        logger.error(msg + 'error during save data.', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during save data.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const msg = cmnMsg + 'DELETE - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const id = idFromUrl(request.url);
    try {
        const result = await deletePlan(id);
        if (!result.ok) {
            return NextResponse.json({ success: false, message: result.error ?? 'Не удалось удалить.' }, { status: 400 });
        }
        return NextResponse.json({ id }, { status: 200 });
    } catch (err) {
        logger.error(msg + 'error during delete.', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during delete.' }, { status: 500 });
    }
}
