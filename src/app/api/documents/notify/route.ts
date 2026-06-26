import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from "@/src/libs/logger"
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { getQuestionsByIds } from "@/src/repositories/requests/repo"
import { notifyDocumentsReady } from "@/src/services/documentsNotify"

export const dynamic = 'force-dynamic';

const cmnMsg = "API DOCUMENTS-NOTIFY "

/**
 * Trigger endpoint for the "documents ready" notification.
 *
 * The document-formation feature is still under development; this is the
 * integration seam it should call once a lawyer has formed and published all
 * requested documents for a case:
 *
 *   POST /api/documents/notify
 *   { "questionId": 152, "documents": ["Договор аренды", "Акт приёма-передачи"], "documentsUrl"?: "..." }
 *
 * It resolves the case (root question) to the recipient email / name / page URL
 * and sends the branded notification. `documentsUrl` defaults to the public
 * case page (/consultation/{uuid}/) when not supplied.
 *
 * Idempotency/throttling is the caller's responsibility (the documents feature
 * owns its own publish state); this endpoint just sends.
 */
export async function POST(request: NextRequest) {
    const msg = cmnMsg + "POST - "

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 })
    }
    // Publishing documents is a lawyer/admin action — regular users must not be
    // able to trigger notifications for arbitrary cases.
    if (session.user.role !== 'admin' && session.user.role !== 'lowyer') {
        return NextResponse.json({ success: false, message: 'Доступ запрещён.' }, { status: 403 })
    }

    let body: { questionId?: number | string; documents?: unknown; documentsUrl?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid body.' }, { status: 400 })
    }

    const questionId = body.questionId
    if (questionId === undefined || questionId === null || `${questionId}`.trim() === '') {
        return NextResponse.json({ success: false, message: 'questionId is required.' }, { status: 400 })
    }
    const documentNames = Array.isArray(body.documents)
        ? body.documents.map((d) => String(d ?? '').trim()).filter((d) => d.length > 0)
        : []

    try {
        const questions = await getQuestionsByIds([String(questionId)])
        if (questions === null || questions.length === 0) {
            return NextResponse.json({ success: false, message: 'Дело не найдено.' }, { status: 404 })
        }
        const question = questions[0]

        const base = (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL ?? 'https://enki.legal').replace(/\/+$/, '')
        const documentsUrl = (body.documentsUrl && body.documentsUrl.trim())
            ? body.documentsUrl.trim()
            : `${base}/consultation/${question.uuid}/`

        const sent = await notifyDocumentsReady({
            recipient: question.email,
            userName: question.username,
            questionId: question.id,
            documentsUrl,
            documentNames,
        })

        return NextResponse.json({ success: sent }, { status: sent ? 200 : 500 })
    } catch (err) {
        logger.error(msg + "error during documents notification", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'error during documents notification.' },
            { status: 500 }
        )
    }
}
