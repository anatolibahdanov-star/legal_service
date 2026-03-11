import { NextRequest, NextResponse } from 'next/server';
import {
    getQuestionsByIds,
    saveQuestion,
    deleteQuestion,
    addLLMReply,
    updateEmailStatus
} from "@/src/repositories/requests/repo"
import {DBQuestions} from "@/src/interfaces/db"
import {EmailDataI} from "@/src/interfaces/email"
import {sendIIBot, sendConsultantPlusBot} from "@/src/services/llm";
import {SendSendGridEmail} from "@/src/services/sendgrid"
import logger from "@/src/services/logger"

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    const msg = "API QUESTION GET: "
    // logger.info("API QUESTION GET: request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    // logger.info('API QUESTION GET: requestUrlId', requestUrlId, typeof requestUrlId)

    let question: DBQuestions | null = null
    try {
        const is_number = !isNaN(Number(requestUrlId))
        const questions = await getQuestionsByIds([requestUrlId], is_number)
        logger.info(msg + 'questions', questions)
        if (questions !== null) {
            question = questions[0]

            // if(question.reply_status === 0 && question.reply === '' && is_number) {
            //     const start = performance.now();
            //     const llm = await sendIIBot(question.question)
            //     const duration = start - performance.now();
            //     if(llm) {
            //         logger.info("(LLM)" + msg + "reply length/duration ", llm.length, duration)
            //         logger.info("(LLM)" + msg + "reply ", llm)
            //         const _questions = await addLLMReply(requestUrlId.toString(), llm, duration)
            //         if (_questions !== null) {
            //             question = _questions[0]
            //         }
            //     }
            // } else {
            //     logger.info(msg + "no llm request!!!")
            // }
            
        }
    } catch(err) {
        logger.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during get question info.' },
            { status: 401 }
        );
    }
    logger.info(msg + 'response out', question)
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = "API QUESTION PUT: "
    // logger.info(msg + "request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    const updatedQuestion: DBQuestions = await request.json();
    logger.info(msg + "request in updatedQuestion", updatedQuestion)

    /* if(updatedQuestion.chat === 1) {
        const consultantReply = await sendConsultantPlusBot(updatedQuestion.question)
        logger.info(msg + " Consultant+ response", consultantReply)
    } else {
        logger.info(msg + " no Consultant+ request", updatedQuestion)
    }
    return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + ': TEST.', updatedQuestion },
            { status: 404 }
        );*/
    
    if(updatedQuestion?.isGenerate === true && updatedQuestion.reply) {
        const start = performance.now();
        const llm = await sendIIBot(updatedQuestion.reply)
        const duration = start - performance.now();
        if(llm) {
            logger.info("(LLM)" + msg + "reply length/duration ", llm.length, duration)
            logger.info("(LLM)" + msg + "reply ", llm)
            updatedQuestion.final_reply = llm
        }
    } else {
        logger.info(msg + "no llm request!!!")
    }

    let question: DBQuestions | null = null
    try {
        question = await saveQuestion(requestUrlId, updatedQuestion)
        logger.info(msg + 'question', question)
        if (question === null) {
            return NextResponse.json(
                { success: false, message: '(ERROR)' + msg + ': not found.' },
                { status: 404 }
            );
        }
    } catch(err) {
        logger.info("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + ': during save data process.' },
            { status: 401 }
        );
    }
    logger.info(msg + 'response out', updatedQuestion, question)
    if(question?.status === 4 && question.email_status === 0) {
        const domainUrl = process.env.NEXTAUTH_URL
        const sendData: EmailDataI = {
            recipient: question.email,
            url: domainUrl + '/consultation/' + question.uuid + '/',
            username: question.username
        }
        const isSendEmail = await SendSendGridEmail(sendData)
        let email_status = 1
        if(!isSendEmail) {
            logger.error("(ERROR)" + msg + "email on question ready was not sent", sendData)
            email_status = 2
        }
        await updateEmailStatus(question.id, email_status)
        question.email_status = email_status
    }
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PATCH(request: Request) {
    return handler(request);
}

export async function DELETE(request: Request) {
    const msg = "API QUESTION DELETE: "
    // logger.info(msg + "request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];

    let question: DBQuestions | null = null
    try {
        const questions = await deleteQuestion(requestUrlId)
        logger.info(msg + 'questions', questions)
        if (questions !== null) {
            question = questions[0]
        }
    } catch(err) {
        logger.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during deleting data.' },
            { status: 401 }
        );
    }
    logger.info(msg + 'response out', question)
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

async function handler(request: Request) {
    // get part after /api/admin/ in string url
    const requestUrl = request.url.split('/api/requests')[1];

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