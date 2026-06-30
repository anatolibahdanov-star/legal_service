import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { AdminOperationTypeE } from '@/src/interfaces/payment'
import { getAdminUserOperations, adminTopUp } from '@/src/services/adminOperations'

export const dynamic = 'force-dynamic';

const cmnMsg = "API OPERATIONS "

const allowedTypes = new Set<string>([...Object.values(AdminOperationTypeE), 'free'])

async function requireSuperAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { ok: false as const, status: 401, message: 'Требуется авторизация.' }
    }
    if (!session.user.is_super) {
        return { ok: false as const, status: 403, message: 'Доступ запрещён.' }
    }
    return { ok: true as const, adminId: parseInt(session.user.id.toString(), 10) }
}

export async function GET(request: NextRequest) {
    const msg = cmnMsg + "GET - "
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    if (!userId) {
        return NextResponse.json({ success: false, message: 'user_id is required.' }, { status: 400 })
    }
    const rawType = searchParams.get('type') ?? 'all'
    const type = allowedTypes.has(rawType) ? (rawType as AdminOperationTypeE | 'free') : 'all'

    try {
        const items = await getAdminUserOperations(userId, type)
        return NextResponse.json({ items }, { status: 200 })
    } catch (err) {
        logger.error(msg + "error during get data", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'error during get operations.' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    const msg = cmnMsg + "POST - "
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    let body: { user_id?: number | string; amount?: number; comment?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid body.' }, { status: 400 })
    }

    const userId = body.user_id
    const amount = Number(body.amount)
    const comment = (body.comment ?? '').toString()
    if (!userId) {
        return NextResponse.json({ success: false, message: 'user_id is required.' }, { status: 400 })
    }

    try {
        const result = await adminTopUp(userId, amount, comment, auth.adminId)
        if (!result.ok) {
            return NextResponse.json({ success: false, message: result.error }, { status: 400 })
        }
        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        logger.error(msg + "error during top-up", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'error during balance change.' },
            { status: 500 }
        )
    }
}
