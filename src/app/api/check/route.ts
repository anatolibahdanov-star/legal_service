import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import {DBOrder} from "@/src/interfaces/db"
import { getActiveOrderByUserId } from '@/src/repositories/orders/repo';

export const dynamic = 'force-dynamic'; // defaults to auto

const cmnMsg = "API ORDER "

export async function GET(request: NextRequest) {
    const msg = "API ORDER CHECK GET - "
    logger.info(msg + "request", request)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized.' },
            { status: 401 }
        );
    }
    const user = session.user

    let order: DBOrder | null | undefined = null
    try {
        order = await getActiveOrderByUserId(user.id)
        // console.log(msg + 'order', order)
        if (order === null) {
            return NextResponse.json(
                { success: false, message: msg + 'order not found.' },
                { status: 404 }
            );
        }
        if (order === undefined) {
            return NextResponse.json(
                { success: false, message: msg + 'too many orders found.' },
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
    const msg = cmnMsg + "POST - "
    logger.info(msg + "request")
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = cmnMsg + "PUT - "
    logger.info(msg + "request")
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = cmnMsg + "PATCH - "
    logger.info(msg + "request")
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = cmnMsg + "DELETE - "
    logger.info(msg + "request")
    return handler(request);
}

async function handler(request: Request) {
    logger.warn("Unknown request", request)
    return NextResponse.json(
        { success: false, message: 'Unknown request.' },
        { status: 422 }
    );
}