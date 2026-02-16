import { NextRequest, NextResponse } from 'next/server';
import {getAdministratorsByIds, saveAdministrator, deleteAdministrator} from "@/src/repositories/administrators/repo"
import {DBAdminUser} from "@/src/interfaces/db"

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    const msg = "API ADMINISTRATOR GET: "
    // console.log(msg + "request", request)
    const requestUrlId = parseInt(request.url.split('/api/administrators/')[1]);
    console.log(msg + 'requestUrlId', requestUrlId, typeof requestUrlId)

    let admin: DBAdminUser | null = null
    try {
        const admins = await getAdministratorsByIds([requestUrlId.toString()])
        console.log(msg + 'admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during get data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'admin out', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = "API ADMINISTRATOR PUT: "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/administrators/')[1];
    const updatedAdmin: DBAdminUser = await request.json(); 

    let admin: DBAdminUser | null = null
    try {
        const admins = await saveAdministrator(requestUrlId, updatedAdmin)
        console.log(msg + 'admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during save data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'updated', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PATCH(request: Request) {
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = "API ADMINISTRATOR DELETE: "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/administrators/')[1];

    let admin: DBAdminUser | null = null
    try {
        const admins = await deleteAdministrator(requestUrlId)
        console.log(msg + 'admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during deleting data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'deleted', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
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