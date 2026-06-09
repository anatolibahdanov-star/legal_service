import { NextRequest, NextResponse } from 'next/server';
import {
    getQuestionsByIds,
    saveQuestion,
    deleteQuestion,
    addLLMReply,
    updateEmailStatus,
    getJobById,
    saveQuestionRating,
} from "@/src/repositories/requests/repo"
import {DBQuestion} from "@/src/interfaces/db"
import {EmailDataI, EmailLawRatingDataI} from "@/src/interfaces/email"
import {sendGrokBot, sendConsultantPlusBot} from "@/src/libs/llm";
import { toClientReply } from "@/src/libs/grokReply";
import {sendEmailLowRating, SendSendGridEmail} from "@/src/libs/sendgrid"
import { invalidatePdfCache, deleteDraftPdf, regenerateCanonicalPdf } from "@/src/services/pdf"
import logger from "@/src/libs/logger"
import { UserRatingRequest } from '@/src/interfaces/api';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic'; // defaults to auto
const LOW_RATING_RATE = 3

function stripTags(html: string): string {
    return (html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function buildClarifyingGrokPrompt(rootId: number, updatedQuestion: DBQuestion): Promise<string> {
    const thread = await getJobById(rootId)
    if (!thread || thread.length === 0) return stripTags(updatedQuestion.reply ?? '')

    const currentId = String(updatedQuestion.child_id)
    const idx = thread.findIndex((m) => String(m.id) === currentId)
    const prior = idx >= 0 ? thread.slice(0, idx) : thread

    const lines: string[] = ['Контекст предыдущей консультации:']
    for (const m of prior) {
        const q = (m.question ?? '').trim()
        const a = stripTags(toClientReply(m.final_reply ?? ''))
        if (q) lines.push(`Вопрос клиента: ${q}`)
        if (a) lines.push(`Ответ юриста: ${a}`)
    }

    const current = idx >= 0 ? thread[idx] : null
    const followup = stripTags(updatedQuestion.reply ?? '') || (current?.question ?? '').trim()
    lines.push('', `Уточняющий вопрос клиента: ${followup}`)
    return lines.join('\n')
}

export async function GET(request: NextRequest) {
    const msg = "API QUESTION GET: "
    logger.info("API QUESTION GET: request in (GET QUESTION BY ID)", request)
    const searchParams = request.nextUrl.searchParams;
    const requestUrlId = request.url.split('/api/requests/')[1];
    // logger.info('API QUESTION GET: requestUrlId', requestUrlId, typeof requestUrlId)

    const _parent = searchParams.get('parent_id');
    const parent_id = _parent ? parseInt(_parent): null
    
    let question: DBQuestion | null = null
    try {
        if(!parent_id) {
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

                logger.info(msg + 'response out', question)
                const response = NextResponse.json(question, { status: 200 });
                response.headers.set("X-Total-Count", "1")
                return response 
            } else {
                logger.error("(ERROR)" + msg + 'unknown error in get request.')
                return NextResponse.json(
                    { success: false, message: '(ERROR)' + msg + 'error during get question info.' },
                    { status: 404 }
                );
            }
        } else {
            const questions = await getJobById(parent_id)
            logger.info(msg + 'parent questions', questions)
            if (questions !== null) {
                logger.info(msg + 'response out', questions)
                const response = NextResponse.json(questions, { status: 200 });
                response.headers.set("X-Total-Count", questions.length.toString())
                return response 
            } else {
                logger.error("(ERROR)" + msg + 'unknown error in get job.')
                return NextResponse.json(
                    { success: false, message: '(ERROR)' + msg + 'error during get question info.' },
                    { status: 404 }
                );
            }
        }
    } catch(err) {
        logger.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during get question info.' },
            { status: 401 }
        );
    }
}

export async function POST(request: Request) {
    const msg = "API QUESTION(Rating) POST: "
    // logger.info(msg + "request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    const updatedRating: UserRatingRequest = await request.json();
    logger.info(msg + "request in updatedRating", updatedRating)

    let question: DBQuestion | null = null
    try {
        question = await saveQuestionRating(requestUrlId, updatedRating)
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
    logger.info(msg + 'response out', updatedRating, question)
    if(question.rating && question.rating <= LOW_RATING_RATE) {
        const sendData: EmailLawRatingDataI = {
            user_id: question.user_id,
            user_name: question.username,
            admin_id: question.admin_id ?? null,
            admin_name: question.owner ?? '',
            question_id: question.id,
            question_rating: question.rating,
            question_rating_comment: question.comment ?? "",
            created_at: question.updated_at,
        }
        const isSendEmail = await sendEmailLowRating(sendData)
        if(!isSendEmail) {
            logger.error("(ERROR)" + msg + "E-mail on update rating for question was not sent", sendData)
        }
    }
    const response = NextResponse.json(question, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PUT(request: Request) {
    const msg = "API QUESTION PUT: "
    // logger.info(msg + "request in", request)
    const requestUrlId = request.url.split('/api/requests/')[1];
    const updatedQuestion: DBQuestion = await request.json();
    logger.info(msg + "request in updatedQuestion", updatedQuestion)

    const session = await getServerSession(authOptions);
    logger.info(msg + "session in updatedQuestion", session)
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
    
    if(updatedQuestion?.isGenerate === true) {
        const isClarifying = !!updatedQuestion.child_id && String(updatedQuestion.child_id) !== requestUrlId
        const grokInput = isClarifying
            ? await buildClarifyingGrokPrompt(Number(requestUrlId), updatedQuestion)
            : updatedQuestion.reply

        if(grokInput) {
            const start = performance.now();
            const llm = await sendGrokBot(grokInput)
            const duration = start - performance.now();
            if(llm) {
                logger.info("(LLM)" + msg + "reply length/duration/noLegalQuestion ", llm.reply.length, duration, llm.noLegalQuestion)
                logger.info("(LLM)" + msg + "reply ", llm.reply)
                if(llm.noLegalQuestion) {
                    updatedQuestion.reply = llm.reply
                } else {
                    updatedQuestion.final_reply = llm.reply
                }
            }
        } else {
            logger.info(msg + "no llm request!!!")
        }
    } else {
        logger.info(msg + "no llm request!!!")
    }

    let question: DBQuestion | null = null
    try {
        question = await saveQuestion(requestUrlId, updatedQuestion, session?.user.id)
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

    if (question) {
        const rootId = question.parent_id ?? question.id
        void (async () => {
            await invalidatePdfCache(rootId)
            await deleteDraftPdf(rootId)
            await regenerateCanonicalPdf(rootId)
        })()
    }

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

    let question: DBQuestion | null = null
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