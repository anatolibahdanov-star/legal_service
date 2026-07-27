import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getAlfaOrderStatus } from '@/src/libs/alfa.pay';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SUBSCRIPTION DIAG ';

async function requireSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { ok: false as const, status: 401, message: 'Требуется авторизация.' };
    }
    if (!session.user.is_super) {
        return { ok: false as const, status: 403, message: 'Доступ запрещён.' };
    }
    return { ok: true as const, user: session.user };
}

export async function GET(request: NextRequest) {
    const msg = cmnMsg + 'GET - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const config = {
        subUsernameSet: Boolean(process.env.ALFA_SUB_USERNAME),
        subPasswordSet: Boolean(process.env.ALFA_SUB_PASSWORD),
        balanceUsernameSet: Boolean(process.env.ALFA_USERNAME),
        domainUrl: process.env.NEXT_PUBLIC_URL ?? null,
    };

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
        return NextResponse.json({
            config,
            hint: 'Передайте ?orderId=<alfa_id заказа подписки>, чтобы опросить статус под подписочными кредами и проверить, создалась ли привязка (bindingId).',
        }, { status: 200 });
    }

    try {
        const res = await getAlfaOrderStatus(orderId, auth.user, true);
        const data = res.data ?? {};
        const bindingId = data?.bindingInfo?.bindingId ?? data?.bindingId ?? null;
        return NextResponse.json({
            config,
            orderId,
            alfa: {
                ok: res.status,
                errorCode: data?.errorCode ?? null,
                errorMessage: data?.errorMessage ?? res.error ?? null,
                orderStatus: data?.orderStatus ?? null,
                actionCode: data?.actionCode ?? null,
                actionCodeDescription: data?.actionCodeDescription ?? null,
                amount: data?.amount ?? null,
                bindingId,
                bindingCreated: Boolean(bindingId),
                bindingInfo: data?.bindingInfo ?? null,
                cardAuthInfo: data?.cardAuthInfo ?? null,
                raw: data,
            },
        }, { status: 200 });
    } catch (err) {
        logger.error(msg + 'error during status query', (err as Error).message);
        return NextResponse.json({ config, orderId, success: false, message: 'Ошибка при запросе статуса в Альфе.' }, { status: 500 });
    }
}
