import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

import { authOptions } from '../../auth/[...nextauth]/route'
import logger from '@/src/libs/logger'
import {
  claimQuestion,
  getQuestionsByIds,
  releaseQuestion,
} from '@/src/repositories/requests/repo'

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'lowyer'
}

async function getRootQuestion(id: number) {
  const questions = await getQuestionsByIds([String(id)])
  const question = questions?.[0] ?? null
  if (!question || question.parent_id) return null
  return question
}

export async function POST(
  _request: Request,
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

  const current = await getRootQuestion(id)
  if (!current) {
    return NextResponse.json({ message: 'Дело не найдено.' }, { status: 404 })
  }
  if (String(current.admin_id) === String(session.user.id)) {
    return NextResponse.json({ data: current })
  }
  if (current.admin_id != null) {
    return NextResponse.json(
      { message: `Дело уже находится в работе у юриста ${current.owner || ''}.`.trim() },
      { status: 409 },
    )
  }

  const claimed = await claimQuestion(id, session.user.id)
  if (!claimed) {
    return NextResponse.json({ message: 'Не удалось назначить дело.' }, { status: 500 })
  }
  if (String(claimed.admin_id) !== String(session.user.id)) {
    logger.warn('REQUEST ASSIGNMENT claim conflict', { question_id: id, admin_id: session.user.id })
    return NextResponse.json(
      { message: `Дело уже взял другой юрист${claimed.owner ? `: ${claimed.owner}` : ''}.` },
      { status: 409 },
    )
  }

  logger.info('REQUEST ASSIGNMENT claimed', { question_id: id, admin_id: session.user.id })
  return NextResponse.json({ data: claimed })
}

export async function DELETE(
  _request: Request,
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

  const current = await getRootQuestion(id)
  if (!current) {
    return NextResponse.json({ message: 'Дело не найдено.' }, { status: 404 })
  }
  if (current.admin_id == null) {
    return NextResponse.json({ data: current })
  }

  const ownsCase = String(current.admin_id) === String(session.user.id)
  if (!ownsCase && !session.user.is_super) {
    return NextResponse.json(
      { message: 'Снять с дела может только назначенный юрист.' },
      { status: 403 },
    )
  }

  const released = await releaseQuestion(id, session.user.id, !!session.user.is_super)
  if (!released) {
    return NextResponse.json({ message: 'Не удалось снять назначение.' }, { status: 500 })
  }
  if (released.admin_id != null) {
    logger.warn('REQUEST ASSIGNMENT release conflict', { question_id: id, admin_id: session.user.id })
    return NextResponse.json(
      { message: 'Назначение изменилось. Обновите страницу и повторите действие.' },
      { status: 409 },
    )
  }

  logger.info('REQUEST ASSIGNMENT released', {
    question_id: id,
    admin_id: session.user.id,
    super_admin: !!session.user.is_super,
  })
  return NextResponse.json({ data: released })
}
