import { NextRequest, NextResponse } from 'next/server';
import {addClientQuestion, getQuestions, getTotalQuestions} from "@/src/repositories/requests/repo"
import {DBQuestions} from "@/src/interfaces/db"
import {UserRequest} from "@/src/interfaces/api"
import logger from "@/src/services/logger"

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    // logger.info("QUESTIONS GET request", request)
    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length-1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort.slice(1, _sort.length-1).split(",").map(param => param.slice(1, param.length-1));
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
    logger.info('API QUESTIONS GET: params', limit, page, sort, filter)

    let questions: DBQuestions[] | null = []
    let total: number = 0;
    try {
        questions = await getQuestions(page, limit, sort, filter)
        total = await getTotalQuestions(filter)
    } catch(err) {
        logger.error("(ERROR)API QUESTIONS GET: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)API QUESTIONS GET: error during get questions info.' },
            { status: 401 }
        );
    }
    const response = NextResponse.json(questions, { status: 200 });
    const header_str = _range[0] + '-' + _range[1] + '/' + total
    response.headers.set("Content-Range", "requests " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    return response 
}

export async function POST(request: Request) {
    // logger.info("API QUESTIONS POST: request ", request)
    const insertedQuestion: UserRequest = await request.json(); 
    logger.info("API QUESTIONS POST: request json", insertedQuestion)
    insertedQuestion.llm = ''

    let question: DBQuestions | null = null
    try {
        const questions = await addClientQuestion(insertedQuestion)
        // logger.info('API QUESTIONS POST: questions ', questions)
        if (questions !== null) {
            question = questions[0]
        }
    } catch(err) {
        logger.error("(ERROR)API QUESTIONS POST: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)API QUESTIONS POST: error during add question.' },
            { status: 401 }
        );
    }
    logger.info('API QUESTIONS POST: created ', question)
    const response = NextResponse.json(question, { status: 200 });
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