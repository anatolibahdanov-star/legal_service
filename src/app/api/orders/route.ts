import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import {DBOrder} from "@/src/interfaces/db"
import logger from "@/src/libs/logger"
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { getOrders, getTotalOrders } from '@/src/repositories/orders/repo';
import { getWizardQuestionById } from '@/src/repositories/requests/repo';
import { UserBalanceRequest } from '@/src/interfaces/api';
import { OrderTypeE } from '@/src/interfaces/payment';
import { QuestionStatusesE } from '@/src/interfaces/data';
import { initNewOrder } from '@/src/services/order';
import { getSettingNumber } from '@/src/services/settings';

export const dynamic = 'force-dynamic'; // defaults to auto

const cmnMsg = "API ORDER "

export async function GET(request: NextRequest) {
    const msg = 'API ORDERS GET - '
    // logger.info("ORDERS GET request", request)
    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length-1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort ?  JSON.parse(_sort) : null
    // if
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
    logger.info(msg + 'params', limit, page, sort, filter)

    let orders: DBOrder[] | null = []
    let total: number = 0;
    try {
        orders = await getOrders(page, limit, sort, filter)
        total = await getTotalOrders(filter)
    } catch(err) {
        logger.error(msg + "during get data", (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + ' error during get orders info.' },
            { status: 401 }
        );
    }
    const response = NextResponse.json(orders, { status: 200 });
    const header_str = _range[0] + '-' + _range[1] + '/' + total
    response.headers.set("Content-Range", "orders " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    return response 
}

export async function POST(request: Request) {
    const msg = cmnMsg + "POST - "
    const balanceRequest: UserBalanceRequest = await request.json(); 
    logger.info(msg + "request json", balanceRequest)

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized.' },
            { status: 401 }
        );
    }
    const user = session.user

    // For OneTime wizard orders, the question must already exist (Step 3
    // creates it as Unpaid). Verify ownership + Unpaid state here so we
    // don't fire an Alfa redirect for someone else's question or a
    // question that's already been paid for.
    if (balanceRequest.type === OrderTypeE.OneTime) {
        const questionId = balanceRequest.data?.questionId;
        if (questionId === undefined || questionId === null || questionId === '') {
            return NextResponse.json(
                { success: false, message: 'questionId is required for OneTime orders.' },
                { status: 400 }
            );
        }
        const question = await getWizardQuestionById(questionId, user.id);
        if (!question) {
            logger.warn(msg + 'OneTime: question not found or not owned by user', { user_id: user.id, question_id: questionId });
            return NextResponse.json(
                { success: false, message: 'Question not found.' },
                { status: 404 }
            );
        }
        if (question.status !== QuestionStatusesE.Unpaid) {
            logger.warn(msg + 'OneTime: question is not Unpaid — refusing card order', {
                user_id: user.id,
                question_id: question.id,
                status: question.status,
            });
            return NextResponse.json(
                { success: false, message: 'Question is already paid.' },
                { status: 409 }
            );
        }
    }

    if (balanceRequest.type !== OrderTypeE.OneTime) {
        const amountKop = Number(balanceRequest.amount)
        const minKop = Math.round(Math.max(0, getSettingNumber('min_topup_rub', 100)) * 100)
        if (!Number.isFinite(amountKop) || amountKop <= 0) {
            return NextResponse.json(
                { success: false, message: 'Некорректная сумма пополнения.' },
                { status: 400 }
            );
        }
        if (amountKop < minKop) {
            return NextResponse.json(
                { success: false, message: `Минимальная сумма пополнения — ${minKop / 100} ₽.` },
                { status: 400 }
            );
        }
    }

    let order: DBOrder | null = null
    try {
        const initOrderData = await initNewOrder(balanceRequest, user)
        if(!initOrderData.status) {
            logger.error(msg + "Error during add order", initOrderData.errors)
            return NextResponse.json(
                { success: false, message: 'Error during init Order.' },
                { status: 404 }
            );
        }
        order = initOrderData.order

    } catch(err) {
        logger.error(msg + "Error during add order", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Error during init Order(2).' },
            { status: 401 }
        );
    }
    
    // logger.info(msg + 'created ', question)
    const response = NextResponse.json(order, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
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