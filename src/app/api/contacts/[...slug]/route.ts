import { NextRequest, NextResponse } from 'next/server';
import {getContactById, deleteContact} from "@/src/repositories/contacts/repo"
import {DBContact} from "@/src/interfaces/db"

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    const msg = "API CONTACT GET - "
    // console.log(msg + "request", request)
    const requestUrlId = parseInt(request.url.split('/api/contacts/')[1]);
    console.log(msg + 'requestUrlId', requestUrlId, typeof requestUrlId)

    let contact: DBContact | null = null
    try {
        contact = await getContactById(requestUrlId)
        if (contact === null) {
            return NextResponse.json(
                { success: false, message: msg + 'contact not found.' },
                { status: 404 }
            );
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'error during get data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'contact out', contact)
    const response = NextResponse.json(contact, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    const msg = "API CONTACT POST: "
    console.log(msg + "request", request)
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = "API CONTACT PUT: "
    console.log(msg + "request", request)
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = "API CONTACT PATCH: "
    console.log(msg + "request", request)
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = "API CONTACT DELETE - "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/contacts/')[1];

    let contact: DBContact | null = null
    try {
        contact = await deleteContact(requestUrlId)
        if (contact === null) {
            return NextResponse.json(
                { success: false, message: msg + 'contact not found.' },
                { status: 404 }
            );
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'error during deleting data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'deleted', contact)
    const response = NextResponse.json(contact, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

async function handler(request: Request) {
    // get part after /api/admin/ in string url
    const requestUrl = request.url.split('/api/contacts')[1];

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