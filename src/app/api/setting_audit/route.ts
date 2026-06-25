import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getSettingAudit } from '@/src/repositories/settings/repo';
import { DBSettingAudit } from '@/src/interfaces/db';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SETTING-AUDIT ';

async function requireSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { ok: false as const, status: 401, message: 'Требуется авторизация.' };
    }
    if (!session.user.is_super) {
        return { ok: false as const, status: 403, message: 'Доступ запрещён.' };
    }
    return { ok: true as const };
}

export async function GET(request: NextRequest) {
    const msg = cmnMsg + 'GET - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') ?? '[0,499]';
    const _range = range.slice(1, range.length - 1).split(',').map(Number);

    let rows: DBSettingAudit[] = [];
    try {
        rows = await getSettingAudit(500);
    } catch (err) {
        logger.error(msg + 'during getting data from DB.', (err as Error).message);
        return NextResponse.json({ success: false, message: 'during getting data from DB.' }, { status: 500 });
    }

    const total = rows.length;
    const response = NextResponse.json(rows, { status: 200 });
    const header_str = (_range[0] ?? 0) + '-' + (total > 0 ? total - 1 : 0) + '/' + total;
    response.headers.set('Content-Range', 'setting_audit ' + header_str);
    response.headers.set('X-Total-Count', total.toString());
    response.headers.set('Cache-Control', 'no-store');
    return response;
}
