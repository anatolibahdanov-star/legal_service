import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import {getUsers, getTotalUsers} from "@/src/repositories/users/repo"
import {DBUser} from "@/src/interfaces/db"
import logger from "@/src/libs/logger"

export const dynamic = 'force-dynamic'; // defaults to auto

function sanitizeUser(user: DBUser): Record<string, unknown> {
    const safe: Record<string, unknown> = { ...user };
    delete safe.password;
    delete safe.temp_password;
    delete safe.email_verify_token;
    return safe;
}

export async function GET(request: NextRequest) {
    const msg = "API USERS GET - "
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 });
    }
    if (session.user.role === 'user') {
        return NextResponse.json({ success: false, message: 'Доступ запрещён.' }, { status: 403 });
    }
    // logger.info(msg + "request", request)
    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length-1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort.slice(1, _sort.length-1).split(",").map(param => param.slice(1, param.length-1));
    // if
    let limit = searchParams.get('limit');
    if (!limit && _range.length > 0) {
        limit = (_range[1] - _range[0] + 1).toString()
    } else if(!limit) {
        limit = '10'
    }
    let page = searchParams.get('page');
    if (!page && _range.length > 0) {
        page = Math.ceil((_range[1] + 1)/parseInt(limit)).toString()
    } else if(!page) {
        page = '1'
    }
    const filter = _filter ?  JSON.parse(_filter) : null
    logger.info(msg + 'params', limit, page, sort, filter)

    let users: DBUser[] | null = []
    let total: number = 0;
    try {
        users = await getUsers(page, limit, sort, filter)
        total = await getTotalUsers(filter)
    } catch(err) {
        logger.error(msg + 'error during get questions info', (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)API QUESTIONS GET: error during get questions info.' },
            { status: 401 }
        );
    }
    const safeUsers = (users ?? []).map(sanitizeUser);
    const response = NextResponse.json(safeUsers, { status: 200 });
    const header_str = _range[0] + '-' + _range[1] + '/' + total
    response.headers.set("Content-Range", "users " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    return response 
}

export async function POST(request: Request) {
    return handler(request);
}

export async function PUT(request: Request) {
    return handler(request);
}

export async function PATCH(request: Request) {
    return handler(request);
}

export async function DELETE(request: Request) {
    return handler(request);
}

async function handler(request: Request) {
    // get part after /api/admin/ in string url
    const requestUrl = request.url.split('/api/users')[1];

    // build the CRUD request based on the incoming request
    const url = `${process.env.SUPABASE_URL}/rest/v1${requestUrl}`;

    const options: RequestInit = {
        method: request.method,
        headers: {
            prefer: (request.headers.get('prefer') as string) ?? '',
            accept: request.headers.get('accept') ?? 'application/json',
            ['content-type']:
                request.headers.get('content-type') ?? 'application/json',
        },
    };

    if (request.body) {
        const body = await request.json();
        options.body = JSON.stringify(body);
    }

    // call the CRUD API
    const response = await fetch(url, options);

    const contentRange = response.headers.get('content-range');

    const headers = new Headers();
    if (contentRange) {
        headers.set('Content-Range', contentRange);
    }
    const data = await response.text();
    return new Response(data, {
        status: 200,
        headers,
    });
}