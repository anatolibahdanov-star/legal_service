import { NextRequest, NextResponse } from 'next/server';
import {getAdministrators, getTotalAdministrators, addAdministrator} from "@/src/repositories/administrators/repo"
import {DBUser} from "@/src/interfaces/db"

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    // console.log("API ADMINISTRATORS GET: request", request)
    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length-1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort.slice(1, _sort.length-1).split(",").map(param => param.slice(1, param.length-1));

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
    // console.log('API ADMINISTRATORS GET: params', limit, page, sort)

    let admins: DBUser[] | null = []
    let total: number = 0;
    try {
        admins = await getAdministrators(page, limit, sort, filter)
        total = await getTotalAdministrators(filter)
    } catch(err) {
        console.error("(ERROR)API ADMINISTRATORS GET: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)API ADMINISTRATORS GET: during getting data from DB.' },
            { status: 401 }
        );
    }
    const response = NextResponse.json(admins, { status: 200 });
    const header_str = _range[0] + '-' + _range[1] + '/' + total
    response.headers.set("Content-Range", "administrators " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    // console.log('API ADMINISTRATORS GET: result', admins)
    return response 
}

export async function POST(request: Request) {
    // console.log("API ADMINISTRATORS POST: request", request)
    const insertedAdmin: DBUser = await request.json();
    console.log("API ADMINISTRATORS POST: insertedAdmin", insertedAdmin)

    let admin: DBUser | null = null
    try {
        const admins = await addAdministrator(insertedAdmin)
        // console.log('API ADMINISTRATORS POST: admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("(ERROR)API ADMINISTRATORS POST: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'API ADMINISTRATORS POST: error during adding administrator process.' },
            { status: 401 }
        );
    }
    console.log('API ADMINISTRATORS POST: admin', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PUT(request: NextRequest) {
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
    const requestUrl = request.url.split('/api/administrator')[1];

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