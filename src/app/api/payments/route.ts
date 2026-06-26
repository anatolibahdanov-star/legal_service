import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { getPaymentHistory } from '@/src/services/paymentHistory';

export const dynamic = 'force-dynamic';

const cmnMsg = "API PAYMENTS "

export async function GET(request: NextRequest) {
    const msg = cmnMsg + "GET - "
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized.' },
            { status: 401 }
        );
    }
    const user = session.user

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
    const rawLimit = parseInt(searchParams.get('limit') ?? '10', 10) || 10
    const limit = Math.min(Math.max(rawLimit, 1), 100)

    try {
        const history = await getPaymentHistory(user.id, page, limit)
        return NextResponse.json(history, { status: 200 });
    } catch (err) {
        logger.error(msg + "error during get data", (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'error during get payment history.' },
            { status: 500 }
        );
    }
}
