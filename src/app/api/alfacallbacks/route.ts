import { NextRequest, NextResponse } from 'next/server';
import logger from "@/src/libs/logger"

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    const msg = 'API ALFA CALLBACKS GET - '
    logger.info(msg + "request", request)
    return handler(request);
}

export async function POST(request: Request) {
    const msg = 'API ALFA CALLBACKS POST - '
    logger.info(msg + "request", request)
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = 'API ALFA CALLBACKS PUT - '
    logger.info(msg + "request", request)
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = 'API ALFA CALLBACKS PATCH - '
    logger.info(msg + "request", request)
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = 'API ALFA CALLBACKS DELETE - '
    logger.info(msg + "request", request)
    return handler(request);
}

async function handler(request: Request) {
    // get part after /api/admin/ in string url
    const requestUrl = request.url.split('/api/alfacallbacks')[1];

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