import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { adminAccrueFreeQuestions } from '@/src/services/adminOperations'

export const dynamic = 'force-dynamic';

const cmnMsg = "API OPERATIONS FREE-QUESTIONS "

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

export async function POST(request: NextRequest) {
    const msg = cmnMsg + "POST - "
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    let body: { user_id?: number | string; count?: number; comment?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid body.' }, { status: 400 })
    }

    const userId = body.user_id
    const count = Number(body.count)
    const comment = (body.comment ?? '').toString()
    if (!userId) {
        return NextResponse.json({ success: false, message: 'user_id is required.' }, { status: 400 })
    }

    try {
        const result = await adminAccrueFreeQuestions(userId, count, comment, auth.adminId)
        if (!result.ok) {
            return NextResponse.json({ success: false, message: result.error }, { status: 400 })
        }
        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        logger.error(msg + "error during accrual", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'error during free questions accrual.' },
            { status: 500 }
        )
    }
}
