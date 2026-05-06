import { NextRequest, NextResponse } from 'next/server';
import logger from "@/src/libs/logger"
import {getAdministrators, getTotalAdministrators, addAdministrator} from "@/src/repositories/administrators/repo"
import {DBUser} from "@/src/interfaces/db"

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    const msg = "API ADMINISTRATORS GET - ";
    // logger.info(msg + "request", request)
    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length-1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort.slice(1, _sort.length-1).split(",").map(param => param.slice(1, param.length-1));

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
    // logger.info(msg + 'params', limit, page, sort)

    let admins: DBUser[] | null = []
    let total: number | null = 0;
    try {
        admins = await getAdministrators(page, limit, sort, filter)
        total = await getTotalAdministrators(filter) ?? 0
    } catch(err) {
        logger.error(msg + "during getting data from DB.", (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'during getting data from DB.' },
            { status: 401 }
        );
    }
    const response = NextResponse.json(admins, { status: 200 });
    const header_str = _range[0] + '-' + _range[1] + '/' + total
    response.headers.set("Content-Range", "administrators " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    // logger.info(msg + 'result', admins)
    return response 
}

export async function POST(request: Request) {
    const msg = "API ADMINISTRATORS POST - "
    // logger.info(msg + "request", request)
    const insertedAdmin: DBUser = await request.json();
    logger.info(msg + "insertedAdmin", insertedAdmin)

    let admin: DBUser | null = null
    try {
        const admins = await addAdministrator(insertedAdmin)
        // logger.info('API ADMINISTRATORS POST: admins', admins)
        if (admins !== null) {
            admin = admins[0]
        }
    } catch(err) {
        logger.error(msg + "Error during adding administrator process", (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'Error during adding administrator process.' },
            { status: 401 }
        );
    }
    logger.info('admin', admin)
    const response = NextResponse.json(admin, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PUT(request: NextRequest) {
    const msg = "API ADMINISTRATORS PUT - ";
    logger.info(msg)
    return handler(request);
}

export async function PATCH(request: Request) {
    const msg = "API ADMINISTRATORS PATCH - ";
    logger.info(msg)
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = "API ADMINISTRATORS DELETE - ";
    logger.info(msg)
    return handler(request);
}

async function handler(request: Request) {
    logger.info("Unknown request to API ", request)
    return NextResponse.json(
        { success: false, message: 'Unknown request to API.' },
        { status: 422 }
    );
}