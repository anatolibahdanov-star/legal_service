import { NextRequest, NextResponse } from 'next/server';
import {getAdministratorsByIds, saveAdministrator, deleteAdministrator, DBAdminUser} from "@/src/repositories/administrators/repo"

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    console.log("Administrators GET request", request)
    const requestUrlId = parseInt(request.url.split('/api/administrators/')[1]);
    console.log('Administrators GET SINGLE requestUrlId', requestUrlId, typeof requestUrlId)

    let admin: DBAdminUser | null = null
    try {
        const admins = await getAdministratorsByIds([requestUrlId.toString()])
        console.log('Administrators admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("Exception(administrator) in GET: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(administrator) in GET.' },
            { status: 401 }
        );
    }
    console.log('Administrators admin', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    return handler(request);
}

export async function PUT(request: Request) {
    console.log("Administrators PUT request", request)
    const requestUrlId = request.url.split('/api/administrators/')[1];
    const updatedAdmin: DBAdminUser = await request.json(); 

    let admin: DBAdminUser | null = null
    try {
        const admins = await saveAdministrator(requestUrlId, updatedAdmin)
        console.log('Administrators admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("Exception(administrator) in PUT: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(administrator) in PUT.' },
            { status: 401 }
        );
    }
    console.log('Administrators updated admin', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PATCH(request: Request) {
    return handler(request);
}

export async function DELETE(request: Request) {
    console.log("Administrators DELETE request", request)
    const requestUrlId = request.url.split('/api/administrators/')[1];

    let admin: DBAdminUser | null = null
    try {
        const admins = await deleteAdministrator(requestUrlId)
        console.log('Administrators deleted admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        console.error("Exception(administrator) in DELETE: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(administrator) in DELETE.' },
            { status: 401 }
        );
    }
    console.log('Administrators deleted admin', admin)
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