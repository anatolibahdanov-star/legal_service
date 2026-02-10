import { NextRequest, NextResponse } from 'next/server';
import {
    getQuestionsByIds,
    saveQuestion,
    deleteQuestion,
    addLLMReply,
    DBQuestions
} from "@/src/repositories/requests/repo"
import {sendIIBot} from "@/src/services/llm";

export const dynamic = 'force-dynamic'; // defaults to auto
export async function GET(request: NextRequest) {
    console.log("QUESTION GET request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    console.log('QUESTION GET SINGLE requestUrlId', requestUrlId, typeof requestUrlId)


    let question: DBQuestions | null = null
    try {
        const is_number = !isNaN(Number(requestUrlId))
        const questions = await getQuestionsByIds([requestUrlId], is_number)
        console.log('QUESTION questions', questions)
        if (questions !== null) {
            question = questions[0]

            if(question.reply_status === 0 && question.reply === '' && is_number) {
                const llm = await sendIIBot(question.question)
                if(llm) {
                    console.log("LLM QUESTION reply length ", llm.length)
                    console.log("LLM QUESTION reply ", llm)
                    const _questions = await addLLMReply(requestUrlId.toString(), llm)
                    if (_questions !== null) {
                        question = _questions[0]
                    }
                }
            } else {
                console.log("QUESTION GET")
            }
            
        }
    } catch(err) {
        console.error("Exception(QUESTION) in GET: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(QUESTION) in GET.' },
            { status: 401 }
        );
    }
    console.log('QUESTION GET response out', question)
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response 
}

export async function POST(request: Request) {
    return handler(request);
}

export async function PUT(request: Request) {
    console.log("QUESTIONS PUT request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    const updatedQuestion: DBQuestions = await request.json(); 

    let question: DBQuestions | null = null
    try {
        const questions = await saveQuestion(requestUrlId, updatedQuestion)
        console.log('QUESTIONS questions', questions)
        if (questions !== null) {
            question = questions[0]
        }
    } catch(err) {
        console.error("Exception(QUESTIONS) in PUT: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(QUESTIONS) in PUT.' },
            { status: 401 }
        );
    }
    console.log('QUESTIONS PUT response out', question)
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PATCH(request: Request) {
    return handler(request);
}

export async function DELETE(request: Request) {
    console.log("QUESTIONS DELETE request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];

    let question: DBQuestions | null = null
    try {
        const questions = await deleteQuestion(requestUrlId)
        console.log('QUESTIONS DELETE questions', questions)
        if (questions !== null) {
            question = questions[0]
        }
    } catch(err) {
        console.error("Exception(QUESTIONS) in DELETE: ", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Exception(QUESTIONS) in DELETE.' },
            { status: 401 }
        );
    }
    console.log('QUESTIONS DELETE response out', question)
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