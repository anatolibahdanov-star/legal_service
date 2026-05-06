import { NextRequest, NextResponse } from 'next/server';
import {getOrderById, deleteOrder} from "@/src/repositories/orders/repo"
import {DBOrder} from "@/src/interfaces/db"

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    const msg = "API ORDER GET - "
    // console.log(msg + "request", request)
    const requestUrlId = parseInt(request.url.split('/api/orders/')[1]);
    console.log(msg + 'requestUrlId', requestUrlId, typeof requestUrlId)

    let order: DBOrder | null = null
    try {
        order = await getOrderById(requestUrlId.toString())
        // console.log(msg + 'order', order)
        if (order === null) {
            return NextResponse.json(
                { success: false, message: msg + 'order not found.' },
                { status: 404 }
            );
        }
    } catch(err) {
        console.error(msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'error during get data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'order out', order)
    const response = NextResponse.json(order, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    const msg = "API ORDER POST - "
    console.log(msg + "request", request)
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = "API ORDER PUT - "
    console.log(msg + "request", request)
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = "API ORDER PATCH - "
    console.log(msg + "request", request)
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = "API ORDER DELETE - "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/orders/')[1];

    let order: DBOrder | null = null
    try {
        order = await deleteOrder(requestUrlId)
        // console.log(msg + 'order', order)
        if (order === null) {
            return NextResponse.json(
                { success: false, message: msg + 'order not found.' },
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
    console.log(msg + 'deleted', order)
    const response = NextResponse.json(order, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

async function handler(request: Request) {
    // get part after /api/admin/ in string url
    const requestUrl = request.url.split('/api/orders')[1];

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