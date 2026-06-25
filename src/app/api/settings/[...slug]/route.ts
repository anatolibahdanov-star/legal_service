import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { getSettingById, saveSetting } from '@/src/repositories/settings/repo';
import { reloadSettings } from '@/src/services/settings';
import { DBSetting } from '@/src/interfaces/db';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SETTING ';

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

const idFromUrl = (url: string): string => url.split('/api/settings/')[1]?.split('?')[0];

export async function GET(request: NextRequest) {
    const msg = cmnMsg + 'GET - ';
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const id = idFromUrl(request.url);
    let setting: DBSetting | null = null;
    try {
        setting = await getSettingById(id);
    } catch (err) {
        logger.error(msg + 'error during get data.', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during get data.' }, { status: 500 });
    }
    const response = NextResponse.json(setting, { status: 200 });
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
    const body: Partial<DBSetting> = await request.json();
    try {
        const result = await saveSetting(id, body, auth.adminId);
        if (!result.setting) {
            return NextResponse.json({ success: false, message: result.error ?? 'Не удалось сохранить.' }, { status: 400 });
        }
        await reloadSettings(true);
        const response = NextResponse.json(result.setting, { status: 200 });
        response.headers.set('X-Total-Count', '1');
        return response;
    } catch (err) {
        logger.error(msg + 'error during save data.', (err as Error).message);
        return NextResponse.json({ success: false, message: 'error during save data.' }, { status: 500 });
    }
}
