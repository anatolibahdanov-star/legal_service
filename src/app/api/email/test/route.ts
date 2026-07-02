import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import logger from '@/src/libs/logger'
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { sendEmail, EmailProviderName } from '@/src/libs/email/transport'

export const dynamic = 'force-dynamic'

const isValidProvider = (v: unknown): v is EmailProviderName =>
  v === 'sendgrid' || v === 'smtp' || v === 'unisender'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false as const, status: 401, message: 'Требуется авторизация.' }
  }
  if (!session.user.is_super) {
    return { ok: false as const, status: 403, message: 'Доступ запрещён.' }
  }
  return { ok: true as const }
}

async function runTest(to: string, providerRaw: unknown) {
  const msg = 'API EMAIL-TEST - '
  const address = (to ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return NextResponse.json({ success: false, message: 'Укажите корректный email в параметре "to".' }, { status: 400 })
  }
  const provider: EmailProviderName = isValidProvider(providerRaw) ? providerRaw : 'unisender'

  const subject = 'Тестовое письмо — Enki.legal'
  const html = `<!DOCTYPE html>
<html lang="ru"><body style="margin:0;padding:0;background:#F5F7FA;font-family:Arial,Helvetica,sans-serif;color:#0F1B2D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;padding:40px;"><tr><td>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:28px;color:#0F1B2D;">Тестовое письмо</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:22px;color:#3a4452;">Это проверка отправки через провайдера <strong>${provider}</strong>.</p>
      <p style="margin:0;font-size:13px;line-height:20px;color:#6B7280;">Если вы видите это письмо — интеграция работает.</p>
    </td></tr></table>
  </td></tr></table>
</body></html>`
  const text = `Тестовое письмо — Enki.legal\n\nПроверка отправки через провайдера ${provider}. Если вы видите это письмо — интеграция работает.`

  try {
    const ok = await sendEmail({ to: address, subject, html, text }, { provider })
    if (!ok) {
      logger.error(msg + 'send failed', { to: address, provider })
      return NextResponse.json(
        { success: false, provider, message: 'Провайдер вернул ошибку. Смотрите логи.' },
        { status: 502 },
      )
    }
    return NextResponse.json({ success: true, provider, to: address }, { status: 200 })
  } catch (err) {
    logger.error(msg + 'exception', (err as Error).message)
    return NextResponse.json({ success: false, provider, message: (err as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  }
  const params = request.nextUrl.searchParams
  return runTest(params.get('to') ?? '', params.get('provider') ?? undefined)
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  }
  let body: { to?: string; provider?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Некорректный JSON.' }, { status: 400 })
  }
  return runTest(body.to ?? '', body.provider)
}
