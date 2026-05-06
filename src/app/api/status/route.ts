import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import {DBOrder} from "@/src/interfaces/db"
import { checkOrderStatus } from '@/src/services/order';

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    const msg = "API ORDER STATUS GET - "
    console.log(msg + "request", request)
    return handler(request);
}

export async function POST(request: Request) {
    const msg = "API ORDER STATUS POST - "
    logger.info(msg + "request", request)
     // Access the dynamic slug
    const balanceRequest = await request.json(); 
    logger.info(msg + "request json", balanceRequest)
    const slug = balanceRequest.slug;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized.' },
            { status: 401 }
        );
    }
    const user = session.user

    // Access the request body if needed
    // const body = await request.json();

    let order: DBOrder | null = null
    try {
        const checkOrderData = await checkOrderStatus(slug, user)
        if(!checkOrderData.status) {
            logger.error(msg + "Error during add question", checkOrderData.errors)
            return NextResponse.json(
                { success: false, message: 'Error during init Order.' },
                { status: 404 }
            );
        }
        order = checkOrderData.order

    } catch(err) {
        logger.error(msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'error during get data.' },
            { status: 401 }
        );
    }


    logger.info(msg + 'order out', order)
    const response = NextResponse.json(order, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PUT(request: Request) {
    const msg = "API ORDER STATUS PUT - "
    console.log(msg + "request", request)
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = "API ORDER STATUS PATCH - "
    console.log(msg + "request", request)
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = "API ORDER STATUS DELETE - "
    console.log(msg + "request", request)
    return handler(request);
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