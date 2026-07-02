import { AttachmentDTO } from '@/src/interfaces/db'

export interface UploadAttachmentsResult {
  ok: boolean
  error?: string
  attachments?: AttachmentDTO[]
}

export async function uploadQuestionAttachmentsAction(
  questionId: string | number,
  files: File[],
  lawyer: boolean = false,
): Promise<UploadAttachmentsResult> {
  if (!files || files.length === 0) return { ok: true, attachments: [] }

  const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api'
  const path = `/attachments/question/${questionId}${lawyer ? '/lawyer' : ''}`

  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  try {
    const response = await fetch(api_url + path, {
      method: 'POST',
      body: formData,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: data?.message ?? 'Не удалось загрузить файлы.' }
    }
    return { ok: true, attachments: data.attachments ?? [] }
  } catch {
    return { ok: false, error: 'Не удалось загрузить файлы.' }
  }
}

export async function deleteQuestionAttachmentAction(
  attachmentId: string | number,
): Promise<{ ok: boolean; error?: string }> {
  const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api'

  try {
    const response = await fetch(`${api_url}/attachments/file/${attachmentId}`, {
      method: 'DELETE',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.success === false) {
      return { ok: false, error: data?.message ?? 'Не удалось удалить файл.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Не удалось удалить файл.' }
  }
}
