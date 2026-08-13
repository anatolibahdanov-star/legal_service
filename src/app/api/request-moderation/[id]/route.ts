import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

import { authOptions } from '../../auth/[...nextauth]/route'
import logger from '@/src/libs/logger'
import { QuestionStatusesE } from '@/src/interfaces/data'
import { getQuestionsByIds, moderateQuestion } from '@/src/repositories/requests/repo'

type ModerationAction = 'spam' | 'invalid'

const ACTION_STATUS: Record<
  ModerationAction,
  QuestionStatusesE.Spam | QuestionStatusesE.Disabled
> = {
  spam: QuestionStatusesE.Spam,
  invalid: QuestionStatusesE.Disabled,
}

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'lowyer'
}

/**
 * Archives a question the lawyer refuses to answer: СПАМ or «не активирован»
 * (некорректный вопрос). Pulling it back out of the archive is a normal claim
 * (`POST /api/request-assignments/<id>`), which returns it to «В работе».
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ message: 'Нет доступа.' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: 'Некорректный номер дела.' }, { status: 400 })
  }

  let action: string | undefined
  try {
    const body = (await request.json()) as { action?: string }
    action = body?.action
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос.' }, { status: 400 })
  }
  const nextStatus = ACTION_STATUS[action as ModerationAction]
  if (!nextStatus) {
    return NextResponse.json({ message: 'Неизвестное действие.' }, { status: 400 })
  }

  const questions = await getQuestionsByIds([String(id)])
  const current = questions?.[0] ?? null
  if (!current || current.parent_id) {
    return NextResponse.json({ message: 'Дело не найдено.' }, { status: 404 })
  }
  if (Number(current.job_status) === QuestionStatusesE.Unpaid) {
    return NextResponse.json(
      { message: 'Вопрос не оплачен — работа с ним недоступна.' },
      { status: 409 },
    )
  }
  if (Number(current.job_status) === QuestionStatusesE.Approved) {
    return NextResponse.json(
      { message: 'Дело завершено — ответ уже отправлен.' },
      { status: 409 },
    )
  }
  if (
    current.admin_id != null &&
    String(current.admin_id) !== String(session.user.id) &&
    !session.user.is_super
  ) {
    return NextResponse.json(
      { message: `Дело находится в работе у юриста ${current.owner || ''}.`.trim() },
      { status: 403 },
    )
  }

  const updated = await moderateQuestion(id, nextStatus)
  if (!updated) {
    return NextResponse.json({ message: 'Не удалось изменить статус дела.' }, { status: 500 })
  }
  if (Number(updated.job_status) !== nextStatus) {
    logger.warn('REQUEST MODERATION conflict', {
      question_id: id,
      admin_id: session.user.id,
      action,
      job_status: updated.job_status,
    })
    return NextResponse.json(
      { message: 'Статус дела изменился. Обновите страницу и повторите действие.' },
      { status: 409 },
    )
  }

  logger.info('REQUEST MODERATION archived', {
    question_id: id,
    admin_id: session.user.id,
    action,
    job_status: updated.job_status,
  })
  return NextResponse.json({ data: updated })
}
