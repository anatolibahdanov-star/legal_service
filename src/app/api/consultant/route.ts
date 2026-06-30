import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { sendConsultantSeleniumQuery, ConsultantSeleniumError } from '@/src/libs/consultantSelenium';
import logger from '@/src/libs/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isStaff(role: string | undefined): boolean {
    return role === 'admin' || role === 'lowyer';
}

export async function POST(request: NextRequest) {
    const msg = 'API CONSULTANT POST: ';

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json(
            { success: false, message: 'Требуется авторизация.' },
            { status: 401 }
        );
    }
    if (!isStaff(session.user.role)) {
        return NextResponse.json(
            { success: false, message: 'Доступ запрещён.' },
            { status: 403 }
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {};
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) {
        return NextResponse.json(
            { success: false, message: 'Не указан текст вопроса для Консультант+.' },
            { status: 400 }
        );
    }

    try {
        const reply = await sendConsultantSeleniumQuery(question);
        logger.info(msg + 'reply length', reply.length);
        return NextResponse.json({ success: true, reply }, { status: 200 });
    } catch (err) {
        const message = err instanceof ConsultantSeleniumError
            ? err.message
            : 'Не удалось получить ответ от Консультант+.';
        logger.error('(ERROR)' + msg, (err as Error).message);
        return NextResponse.json({ success: false, message }, { status: 502 });
    }
}
