import { QuestionStatusesE, EmailStatusesE, statusesDesign } from '@/src/interfaces/data'
import type { AttachmentDTO, DBQuestion } from '@/src/interfaces/db'

export const PAGE_SIZE = 20
export const EXPORT_PAGE_SIZE = 200
export const EXPORT_MAX_ROWS = 2000

export type LawyerRequestFilters = {
  username?: string
  email?: string
  question?: string
  category?: string | number
  status?: string | number
  email_status?: string | number
  published_at_gte?: string
  published_at_lte?: string
}

export type OptionalFilterKey =
  | 'username'
  | 'email'
  | 'question'
  | 'category'
  | 'status'
  | 'email_status'

export const OPTIONAL_FILTER_KEYS: OptionalFilterKey[] = [
  'username',
  'email',
  'question',
  'category',
  'status',
  'email_status',
]

export const FILTER_FIELD_DEFS: Record<
  OptionalFilterKey,
  { label: string; kind: 'text' | 'category' | 'status' | 'email_status' }
> = {
  username: { label: 'Пользователь', kind: 'text' },
  email: { label: 'E-mail', kind: 'text' },
  question: { label: 'Вопрос', kind: 'text' },
  category: { label: 'Категория', kind: 'category' },
  status: { label: 'Статус', kind: 'status' },
  email_status: { label: 'Отправка', kind: 'email_status' },
}

export type CategoryOption = { id: number | string; name: string }

export const STATUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: QuestionStatusesE.New, label: statusesDesign[QuestionStatusesE.New].name },
  { value: QuestionStatusesE.InProgress, label: statusesDesign[QuestionStatusesE.InProgress].name },
  { value: QuestionStatusesE.Approved, label: statusesDesign[QuestionStatusesE.Approved].name },
  { value: QuestionStatusesE.Unpaid, label: statusesDesign[QuestionStatusesE.Unpaid].name },
  { value: QuestionStatusesE.Spam, label: statusesDesign[QuestionStatusesE.Spam].name },
  { value: QuestionStatusesE.Disabled, label: statusesDesign[QuestionStatusesE.Disabled].name },
]

export const EMAIL_STATUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: EmailStatusesE.None, label: 'Не отправлено' },
  { value: EmailStatusesE.Sent, label: 'Отправлено' },
  { value: EmailStatusesE.Error, label: 'Ошибка' },
]

export function statusLabel(status?: number | null): string {
  if (status == null) return '—'
  return statusesDesign[status]?.name ?? '—'
}

export function statusColor(status?: number | null): string {
  if (status == null) return '#94a3b8'
  return statusesDesign[status]?.color ?? '#94a3b8'
}

export function emailStatusLabel(status?: number | null): string {
  if (status == null) return '—'
  return EMAIL_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? '—'
}

export function defaultDateFrom(): string {
  return new Date().toISOString().slice(0, 10)
}

export function defaultDateTo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export type RequestRow = DBQuestion & {
  attachments?: AttachmentDTO[]
  owner?: string
  email?: string
}

export function buildRequestsCsv(rows: RequestRow[]): string {
  const header = [
    'ID',
    'Пользователь',
    'E-mail',
    'Юрист',
    'Категория',
    'Вопрос',
    'Статус',
    'Отправка',
    'Дата',
  ]
  const lines = [header.join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.username,
        row.email,
        row.owner,
        row.category_name,
        row.question,
        statusLabel(row.job_status),
        emailStatusLabel(row.email_status),
        row.created_at ? new Date(row.created_at).toISOString() : '',
      ]
        .map(csvEscape)
        .join(','),
    )
  }
  return `\uFEFF${lines.join('\n')}`
}
