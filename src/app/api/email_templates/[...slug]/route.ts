import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { getEmailTemplateById, saveEmailTemplate } from "@/src/repositories/emailTemplates/repo"
import { DBEmailTemplate } from "@/src/interfaces/db"

export const dynamic = 'force-dynamic';

const cmnMsg = "API EMAIL-TEMPLATE "

async function requireSuperAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { ok: false as const, status: 401, message: 'Требуется авторизация.' }
    }
    if (!session.user.is_super) {
        return { ok: false as const, status: 403, message: 'Доступ запрещён.' }
    }
    return { ok: true as const }
}

const idFromUrl = (url: string): string => url.split('/api/email_templates/')[1]?.split('?')[0]

export async function GET(request: NextRequest) {
    const msg = cmnMsg + "GET - "
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const id = idFromUrl(request.url)
    let template: DBEmailTemplate | null = null
    try {
        template = await getEmailTemplateById(id)
    } catch (err) {
        logger.error(msg + "error during get data.", (err as Error).message)
        return NextResponse.json({ success: false, message: 'error during get data.' }, { status: 500 });
    }
    const response = NextResponse.json(template, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PUT(request: NextRequest) {
    const msg = cmnMsg + "PUT - "
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const id = idFromUrl(request.url)
    const body: Partial<DBEmailTemplate> = await request.json();
    let template: DBEmailTemplate | null = null
    try {
        template = await saveEmailTemplate(id, body)
    } catch (err) {
        logger.error(msg + "error during save data.", (err as Error).message)
        return NextResponse.json({ success: false, message: 'error during save data.' }, { status: 500 });
    }
    const response = NextResponse.json(template, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}
