import sgMail from '@sendgrid/mail'
import type { MailDataRequired } from '@sendgrid/mail'
import nodemailer from 'nodemailer'
import logger from '@/src/libs/logger'

export interface EmailAttachment {
  content: string
  filename: string
  type: string
  disposition: 'attachment' | 'inline'
  contentId?: string
}

export interface EmailMessage {
  to: string
  from?: string
  subject?: string
  text?: string
  html?: string
  attachments?: EmailAttachment[]
  templateId?: string
  dynamicTemplateData?: Record<string, unknown>
}

export type EmailProviderName = 'sendgrid' | 'smtp' | 'unisender'

export interface EmailProvider {
  readonly name: EmailProviderName
  send(message: EmailMessage): Promise<boolean>
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

const sendgridSender = (): string =>
  process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'

const sendgridProvider: EmailProvider = {
  name: 'sendgrid',
  async send(message: EmailMessage): Promise<boolean> {
    const mail = {
      to: message.to,
      from: message.from ?? sendgridSender(),
      ...(message.templateId
        ? { templateId: message.templateId, dynamicTemplateData: message.dynamicTemplateData ?? {} }
        : { subject: message.subject, text: message.text, html: message.html }),
      ...(message.attachments && message.attachments.length
        ? {
            attachments: message.attachments.map((a) => ({
              content: a.content,
              filename: a.filename,
              type: a.type,
              disposition: a.disposition,
              ...(a.contentId ? { content_id: a.contentId } : {}),
            })),
          }
        : {}),
    }
    try {
      await sgMail.send(mail as MailDataRequired)
      return true
    } catch (error) {
      logger.error('EMAIL sendgrid send failed', (error as Error).message, { to: message.to })
      return false
    }
  },
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

const smtpSender = (): string => `"Sender Name" <${process.env.SMTP_USER}>`

const smtpProvider: EmailProvider = {
  name: 'smtp',
  async send(message: EmailMessage): Promise<boolean> {
    try {
      const info = await transporter.sendMail({
        from: message.from ?? smtpSender(),
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, 'base64'),
          contentType: a.type,
          ...(a.contentId ? { cid: a.contentId } : {}),
        })),
      })
      return Boolean(info.messageId)
    } catch (error) {
      logger.error('EMAIL smtp send failed', (error as Error).message, { to: message.to })
      return false
    }
  },
}

const unisenderEndpoint = (): string =>
  (process.env.UNISENDER_API_URL ?? 'https://goapi.unisender.ru/ru/transactional/api/v1').replace(/\/+$/, '')

const parseFrom = (from?: string): { name?: string; email?: string } => {
  if (!from) return {}
  const m = from.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
  if (m) return { name: m[1].trim() || undefined, email: m[2].trim() }
  return { email: from.trim() }
}

const unisenderProvider: EmailProvider = {
  name: 'unisender',
  async send(message: EmailMessage): Promise<boolean> {
    const apiKey = process.env.UNISENDER_API_KEY
    const parsed = parseFrom(message.from)
    const fromEmail = parsed.email ?? process.env.UNISENDER_FROM_EMAIL
    const fromName = parsed.name ?? process.env.UNISENDER_FROM_NAME
    if (!apiKey || !fromEmail) {
      logger.error('EMAIL unisender: UNISENDER_API_KEY or UNISENDER_FROM_EMAIL not set', { to: message.to })
      return false
    }
    const redirect = process.env.UNISENDER_REDIRECT_TO?.trim()
    const recipient = redirect || message.to
    const subject = redirect ? `[→ ${message.to}] ${message.subject ?? ''}` : message.subject ?? ''
    if (redirect) {
      logger.info('EMAIL unisender redirect', { realTo: message.to, redirectTo: recipient })
    }
    const payload: Record<string, unknown> = {
      recipients: [{ email: recipient }],
      subject,
      from_email: fromEmail,
      body: {
        ...(message.html ? { html: message.html } : {}),
        ...(message.text ? { plaintext: message.text } : {}),
      },
    }
    if (fromName) payload.from_name = fromName
    if (message.attachments && message.attachments.length) {
      const regular = message.attachments.filter((a) => a.disposition !== 'inline')
      const inline = message.attachments.filter((a) => a.disposition === 'inline')
      if (regular.length) {
        payload.attachments = regular.map((a) => ({
          type: a.type,
          name: a.filename.replace(/\//g, '_'),
          content: a.content,
        }))
      }
      if (inline.length) {
        payload.inline_attachments = inline.map((a) => ({
          type: a.type,
          name: (a.contentId ?? a.filename).replace(/\//g, '_'),
          content: a.content,
        }))
      }
    }
    if (process.env.UNISENDER_SKIP_UNSUBSCRIBE === '1') payload.skip_unsubscribe = 1
    try {
      const resp = await fetch(`${unisenderEndpoint()}/email/send.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({ message: payload }),
      })
      const json = (await resp.json()) as {
        status?: string
        code?: number
        message?: string
        failed_emails?: Record<string, string>
      }
      if (json.status === 'success') {
        const failedReason = json.failed_emails?.[recipient]
        if (failedReason) {
          logger.error('EMAIL unisender recipient rejected', failedReason, { to: recipient })
          return false
        }
        return true
      }
      logger.error('EMAIL unisender send failed', json.message ?? 'unknown', { code: json.code, to: recipient })
      return false
    } catch (error) {
      logger.error('EMAIL unisender send failed', (error as Error).message, { to: message.to })
      return false
    }
  },
}

const providers: Record<EmailProviderName, EmailProvider> = {
  sendgrid: sendgridProvider,
  smtp: smtpProvider,
  unisender: unisenderProvider,
}

const activeProviderName = (): EmailProviderName => {
  const name = process.env.EMAIL_PROVIDER
  if (name === 'smtp' || name === 'sendgrid' || name === 'unisender') return name
  return 'sendgrid'
}

export const sendEmail = (
  message: EmailMessage,
  options?: { provider?: EmailProviderName },
): Promise<boolean> => {
  const name = options?.provider ?? activeProviderName()
  return providers[name].send(message)
}
