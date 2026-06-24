import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { getEmailTemplates, getTotalEmailTemplates } from "@/src/repositories/emailTemplates/repo"
import { DBEmailTemplate } from "@/src/interfaces/db"

export const dynamic = 'force-dynamic';

const cmnMsg = "API EMAIL-TEMPLATES "

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

export async function GET(request: NextRequest) {
    const msg = cmnMsg + "GET - "
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length - 1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort.slice(1, _sort.length - 1).split(",").map(param => param.slice(1, param.length - 1));

    let limit = searchParams.get('limit');
    if (!limit && _range.length > 1) {
        limit = (_range[1] - _range[0] + 1).toString()
    } else if (!limit) {
        limit = '10'
    }
    let page = searchParams.get('page');
    if (!page && _range.length > 1) {
        page = Math.ceil((_range[1] + 1) / parseInt(limit)).toString()
    } else if (!page) {
        page = '1'
    }
    const filter = _filter ? JSON.parse(_filter) : null

    let templates: DBEmailTemplate[] | null = []
    let total = 0
    try {
        templates = await getEmailTemplates(page, limit, sort, filter)
        total = await getTotalEmailTemplates(filter)
    } catch (err) {
        logger.error(msg + "during getting data from DB.", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'during getting data from DB.' },
            { status: 500 }
        );
    }

    const response = NextResponse.json(templates, { status: 200 });
    const header_str = (_range[0] ?? 0) + '-' + (_range[1] ?? 9) + '/' + total
    response.headers.set("Content-Range", "email_templates " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    return response
}
