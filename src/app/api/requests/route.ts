import { NextRequest, NextResponse } from 'next/server';
import {addClientQuestion, getQuestions, getTotalQuestions} from "@/src/repositories/requests/repo"
import {DBQuestion} from "@/src/interfaces/db"
import {UserRequest} from "@/src/interfaces/api"
import logger from "@/src/libs/logger"
import { SendSendGridEmailNewRequest } from '@/src/libs/sendgrid';
import {EmailDataNewRequestI} from "@/src/interfaces/email"
import { verifyRecaptcha } from "@/src/libs/recaptcha"
import { validateRequestForm } from "@/src/app/components/forms/validation/request"
import { RequestFormI } from "@/src/interfaces/form"

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    // logger.info("QUESTIONS GET request", request)
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
    logger.info('API QUESTIONS GET: params', limit, page, sort, filter)

    let questions: DBQuestion[] | null = []
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
    const msg = "API QUESTIONS POST - "
    // logger.info(msg + "request", request)
    const insertedQuestion: UserRequest & { captchaToken?: string } = await request.json();
    logger.info(msg + "request json", insertedQuestion)

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const captcha = await verifyRecaptcha(insertedQuestion.captchaToken, ip, { expectedAction: 'submit_question' })
    if (!captcha.success) {
        logger.warn(msg + 'captcha rejected', { reason: captcha.reason })
        return NextResponse.json(
            { success: false, message: 'CAPTCHA введена не верно.' },
            { status: 400 }
        );
    }

    const formForValidation: RequestFormI = {
        name: insertedQuestion.name ?? "",
        email: insertedQuestion.email ?? "",
        topic: insertedQuestion.topic ?? "",
        question: insertedQuestion.question ?? "",
        agree: true,
        auth: "1",
        parent: insertedQuestion.parent,
    }
    const validation = validateRequestForm(formForValidation)
    if (!validation.is_success) {
        const firstError = validation.errors?.[0]?.error?.[0] ?? 'Некорректные данные.'
        logger.warn(msg + 'validation failed', { errors: validation.errors })
        return NextResponse.json(
            { success: false, message: firstError, errors: validation.errors },
            { status: 400 }
        );
    }

    insertedQuestion.llm = ''
    delete insertedQuestion.captchaToken

    let question: DBQuestion | null = null
    try {
        question = await addClientQuestion(insertedQuestion)
        // logger.info(msg + 'questions ', questions)
        if(question === null) {
            logger.error(msg + "Empty response from addClientQuestion", insertedQuestion)
            return NextResponse.json(
                { success: false, message: 'Error during add question(1).' },
                { status: 404 }
            );
        }

    } catch(err) {
        logger.error(msg + "error during add question", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Error during add question(2).' },
            { status: 401 }
        );
    }

    if(question !== null) {
        const sendData: EmailDataNewRequestI = {
            id: question.id,
            username: question.username,
            email: question.email,
            admin_id: question.admin_id,
        }
        const isSendEmail = await SendSendGridEmailNewRequest(sendData)
        if(!isSendEmail) {
            logger.error(msg + "email on new request event was not sent", sendData)
        }
    }
    
    // logger.info(msg + 'created ', question)
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