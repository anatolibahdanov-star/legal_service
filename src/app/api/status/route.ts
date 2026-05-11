import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import {DBOrder} from "@/src/interfaces/db"
import { checkOrderStatus } from '@/src/services/order';

export const dynamic = 'force-dynamic'; // defaults to auto

const cmnMsg = "API ORDER STATUS "

export async function GET(request: NextRequest) {
    const msg = cmnMsg + "GET - "
    logger.info(msg + "Request")
    return handler(request);
}

export async function POST(request: Request) {
    const msg = cmnMsg + "POST - "
    // logger.info(msg + "Request")
    const balanceRequest = await request.json(); 
    logger.info(msg + "request json", balanceRequest)
    const slug = balanceRequest.slug;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        logger.error(msg + "No session", session, balanceRequest)
        return NextResponse.json(
            { success: false, message: 'Unauthorized.' },
            { status: 401 }
        );
    }
    const user = session.user

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
    const msg = cmnMsg + "PUT - "
    logger.info(msg + "Request")
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = cmnMsg + "PATCH - "
    logger.info(msg + "Request")
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = cmnMsg + "DELETE - "
    logger.info(msg + "Request")
    return handler(request);
}

async function handler(request: Request) {
    logger.info("Unknown request", request)
    return NextResponse.json(
        { success: false, message: 'Unknown request.' },
        { status: 422 }
    );
}