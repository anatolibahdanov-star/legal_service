import { CustomGetRequest, CustomRequest } from '@/src/libs/request'
import type { AttachmentDTO, DBQuestion } from '@/src/interfaces/db'
import type { LawyerRequestFilters, RequestRow, CategoryOption } from './lawyer-requests.data'
import {
  EXPORT_MAX_ROWS,
  EXPORT_PAGE_SIZE,
  PAGE_SIZE,
  buildRequestsCsv,
} from './lawyer-requests.data'

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api'

function buildFilterPayload(filters: LawyerRequestFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  if (filters.username?.trim()) filter.username = filters.username.trim()
  if (filters.email?.trim()) filter.email = filters.email.trim()
  if (filters.question?.trim()) filter.question = filters.question.trim()
  if (filters.category !== undefined && filters.category !== '') {
    filter.category = Number(filters.category)
  }
  if (filters.status !== undefined && filters.status !== '') {
    filter.status = Number(filters.status)
  }
  if (filters.email_status !== undefined && filters.email_status !== '') {
    filter.email_status = Number(filters.email_status)
  }
  if (filters.published_at_gte) filter.published_at_gte = filters.published_at_gte
  if (filters.published_at_lte) filter.published_at_lte = filters.published_at_lte
  return filter
}

export type RequestSort = { field: string; dir: 'ASC' | 'DESC' }

export async function fetchLawyerRequests(opts: {
  page: number
  pageSize?: number
  filters: LawyerRequestFilters
  sort?: RequestSort
  /** Scopes the list to a single lawyer's own cases (the "Мои дела" tab). */
  adminId?: string | number
}): Promise<{ rows: RequestRow[]; total: number; error?: string }> {
  const pageSize = opts.pageSize ?? PAGE_SIZE
  const start = (opts.page - 1) * pageSize
  const end = start + pageSize - 1
  const sort = opts.sort ?? { field: 'id', dir: 'DESC' }
  const filterPayload = buildFilterPayload(opts.filters)
  if (opts.adminId !== undefined) filterPayload.admin_id = Number(opts.adminId)

  const params = new URLSearchParams({
    range: JSON.stringify([start, end]),
    sort: JSON.stringify([sort.field, sort.dir]),
    filter: JSON.stringify(filterPayload),
  })

  try {
    const res = await fetch(`${apiBase()}/requests?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!res.ok) {
      return { rows: [], total: 0, error: 'Не удалось загрузить заявки.' }
    }
    const rows = (await res.json()) as RequestRow[]
    const total = parseInt(res.headers.get('X-Total-Count') ?? '0', 10)
    return { rows: Array.isArray(rows) ? rows : [], total }
  } catch {
    return { rows: [], total: 0, error: 'Не удалось загрузить заявки.' }
  }
}

export async function exportLawyerRequestsCsv(
  filters: LawyerRequestFilters,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  const all: RequestRow[] = []
  let page = 1
  let total = Infinity

  while (all.length < Math.min(total, EXPORT_MAX_ROWS)) {
    const res = await fetchLawyerRequests({
      page,
      pageSize: EXPORT_PAGE_SIZE,
      filters,
    })
    if (res.error) return { ok: false, error: res.error }
    total = res.total
    all.push(...res.rows)
    if (res.rows.length === 0 || all.length >= total) break
    page += 1
  }

  const csv = buildRequestsCsv(all.slice(0, EXPORT_MAX_ROWS))
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true, count: all.length }
}

export async function fetchRequestThread(rootId: string | number): Promise<{
  jobs: DBQuestion[]
  error?: string
}> {
  const res = await CustomGetRequest(`/requests/${rootId}`, { parent_id: String(rootId) })
  if (!res.status || !res.data) {
    return { jobs: [], error: res.error || 'Не удалось загрузить переписку.' }
  }
  const jobs = Array.isArray(res.data) ? (res.data as DBQuestion[]) : []
  return { jobs }
}

export async function fetchRequestRecord(id: string | number): Promise<DBQuestion | null> {
  const res = await CustomGetRequest(`/requests/${id}`)
  if (!res.status || !res.data) return null
  if (Array.isArray(res.data)) return (res.data[0] as DBQuestion) ?? null
  return res.data as DBQuestion
}

export async function fetchAttachmentsMap(
  questionId: string | number,
): Promise<Record<string, AttachmentDTO[]>> {
  const res = await CustomGetRequest(`/attachments/question/${questionId}`, { thread: '1' })
  if (res.status && res.data && typeof res.data === 'object') {
    return res.data as Record<string, AttachmentDTO[]>
  }
  return {}
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const res = await CustomGetRequest('/categories', {
    range: JSON.stringify([0, 99]),
    sort: JSON.stringify(['id', 'ASC']),
    filter: JSON.stringify({}),
  })
  if (!res.status || !res.data) return []
  const rows = Array.isArray(res.data) ? res.data : []
  return rows.map((r: { id: number | string; name: string }) => ({ id: r.id, name: r.name }))
}

export async function saveRequest(
  id: string | number,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data?: DBQuestion; error?: string }> {
  const res = await CustomRequest(`/requests/${id}`, body, 'PUT')
  if (!res.status) return { ok: false, error: res.error || 'Не удалось сохранить.' }
  return { ok: true, data: res.data as DBQuestion }
}

async function changeRequestAssignment(
  id: string | number,
  method: 'POST' | 'DELETE',
): Promise<{ ok: boolean; data?: DBQuestion; error?: string; status?: number }> {
  try {
    const res = await fetch(`/api/request-assignments/${id}`, {
      method,
      credentials: 'include',
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        error: payload?.message || 'Не удалось изменить назначение.',
        status: res.status,
      }
    }
    return { ok: true, data: payload.data as DBQuestion }
  } catch {
    return { ok: false, error: 'Не удалось изменить назначение.' }
  }
}

export function claimRequest(id: string | number) {
  return changeRequestAssignment(id, 'POST')
}

export function releaseRequest(id: string | number) {
  return changeRequestAssignment(id, 'DELETE')
}

export async function moderateRequest(
  id: string | number,
  action: 'spam' | 'invalid',
): Promise<{ ok: boolean; data?: DBQuestion; error?: string; status?: number }> {
  try {
    const res = await fetch(`/api/request-moderation/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        error: payload?.message || 'Не удалось изменить статус дела.',
        status: res.status,
      }
    }
    return { ok: true, data: payload.data as DBQuestion }
  } catch {
    return { ok: false, error: 'Не удалось изменить статус дела.' }
  }
}

export async function deleteRequest(
  id: string | number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${apiBase()}/requests/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) return { ok: false, error: 'Не удалось удалить заявку.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Не удалось удалить заявку.' }
  }
}

export async function runConsultantPlus(
  question: string,
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  try {
    const res = await fetch('/api/consultant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      return { ok: false, error: data?.message || 'Не удалось получить ответ от Консультант+.' }
    }
    return { ok: true, reply: String(data.reply ?? '') }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export function consultantAnswerToHtml(text: string): string {
  const value = (text ?? '').trim()
  if (!value) return ''
  if (/<[a-z][\s\S]*>/i.test(value)) return value
  return value
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('')
}
