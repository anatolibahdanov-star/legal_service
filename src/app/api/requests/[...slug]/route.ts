import { NextRequest, NextResponse } from 'next/server';
import {getAdministrators, getAdministratorsByIds, DBAdminUser} from "@/src/repositories/administrators/repo"

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    console.log("Administrators GET request", request)
    const requestUrlId = parseInt(request.url.split('/api/administrators/')[1]);
    console.log('Administrators GET path', requestUrlId)
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ?? '10';
    const page = searchParams.get('page') ?? '1';
    console.log('Administrators GET limit/offset', limit, page)

    let admins: DBAdminUser[] | null = []
    try {
        if (!requestUrlId) {
            admins = await getAdministrators(page, limit)
        } else {
            admins = await getAdministratorsByIds([requestUrlId.toString()])
        }
    } catch(err) {
        console.error("Exception(administrator) in GET: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(administrator) in GET.' },
            { status: 401 }
        );
    }
    
    return NextResponse.json(admins, { status: 200 });
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