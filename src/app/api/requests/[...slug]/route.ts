import { NextRequest, NextResponse } from 'next/server';
import {
    getQuestionsByIds,
    saveQuestion,
    deleteQuestion,
    addLLMReply,
    updateEmailStatus
} from "@/src/repositories/requests/repo"
import {DBQuestions} from "@/src/interfaces/db"
import {sendIIBot, sendConsultantPlusBot} from "@/src/services/llm";
import SendSendGridEmail, {EmailDataI} from "@/src/services/sendgrid"

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    const msg = "API QUESTION GET: "
    // onsole.log("API QUESTION GET: request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    // console.log('API QUESTION GET: requestUrlId', requestUrlId, typeof requestUrlId)

    let question: DBQuestions | null = null
    try {
        const is_number = !isNaN(Number(requestUrlId))
        const questions = await getQuestionsByIds([requestUrlId], is_number)
        console.log(msg + 'questions', questions)
        if (questions !== null) {
            question = questions[0]

            if(question.reply_status === 0 && question.reply === '' && is_number) {
                const start = performance.now();
                const llm = await sendIIBot(question.question)
                const duration = start - performance.now();
                if(llm) {
                    console.log("(LLM)" + msg + "reply length/duration ", llm.length, duration)
                    console.log("(LLM)" + msg + "reply ", llm)
                    const _questions = await addLLMReply(requestUrlId.toString(), llm, duration)
                    if (_questions !== null) {
                        question = _questions[0]
                    }
                }
            } else {
                console.log(msg + "no llm request!!!")
            }
            
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during get question info.' },
            { status: 401 }
        );
    }
    console.log(msg + 'response out', question)
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    return handler(request);
}

export async function PUT(request: Request) {
    const msg = "API QUESTION PUT: "
    // console.log(msg + "request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    const updatedQuestion: DBQuestions = await request.json();
    console.log(msg + "request in updatedQuestion", updatedQuestion)

    /* if(updatedQuestion.chat === 1) {
        const consultantReply = await sendConsultantPlusBot(updatedQuestion.question)
        console.log(msg + " Consultant+ response", consultantReply)
    } else {
        console.log(msg + " no Consultant+ request", updatedQuestion)
    }
    return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + ': TEST.', updatedQuestion },
            { status: 404 }
        );*/

    let question: DBQuestions | null = null
    try {
        const questions = await saveQuestion(requestUrlId, updatedQuestion)
        console.log(msg + 'questions', questions)
        if (questions !== null) {
            question = questions[0]
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + ': during save data process.' },
            { status: 401 }
        );
    }
    console.log(msg + 'response out', updatedQuestion, question)
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
            console.error("(ERROR)" + msg + "email on question ready was not sent", sendData)
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
    // console.log(msg + "request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];

    let question: DBQuestions | null = null
    try {
        const questions = await deleteQuestion(requestUrlId)
        console.log(msg + 'questions', questions)
        if (questions !== null) {
            question = questions[0]
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during deleting data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'response out', question)
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