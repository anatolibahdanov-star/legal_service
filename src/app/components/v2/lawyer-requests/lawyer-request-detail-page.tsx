'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { RecordContextProvider } from 'react-admin'
import { AdminJobView } from '@/src/app/components/admin/AdminJobView'
import { FileUpload } from '@/src/app/components/forms/FileUpload'
import {
  deleteQuestionAttachmentAction,
  uploadQuestionAttachmentsAction,
} from '@/src/app/components/forms/action/attachments'
import { ATTACH_MAX_FILES } from '@/src/app/components/forms/validation/attachments'
import type { AttachmentDTO, DBQuestion } from '@/src/interfaces/db'
import { QuestionStatusesE } from '@/src/interfaces/data'

import { StaffGate } from './staff-gate'
import { LawyerMetaModal } from './lawyer-meta-modal'
import {
  consultantAnswerToHtml,
  deleteRequest,
  fetchAttachmentsMap,
  fetchCategories,
  fetchRequestRecord,
  fetchRequestThread,
  runConsultantPlus,
  saveRequest,
} from './lawyer-requests.api'
import type { CategoryOption } from './lawyer-requests.data'
import styles from './lawyer-request-detail.module.css'
import listStyles from './lawyer-requests.module.css'

const PDF_LOADING_HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Генерация PDF…</title><style>
html,body{height:100%;margin:0}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
font-family:system-ui,sans-serif;background:#fff;color:#64748b}
.s{width:48px;height:48px;border:5px solid #e2e8f0;border-top-color:#323c54;border-radius:50%;
animation:r .8s linear infinite}
@keyframes r{to{transform:rotate(360deg)}}
</style></head><body><div class="s"></div><div>Генерируем PDF…</div></body></html>`

const plainText = (html: unknown): string =>
  typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    : ''

type Props = { requestId: string }

export function LawyerRequestDetailPage({ requestId }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const isSuper = !!session?.user?.is_super

  const [record, setRecord] = useState<DBQuestion | null>(null)
  const [jobs, setJobs] = useState<DBQuestion[]>([])
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, AttachmentDTO[]>>({})
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [consultantQuestion, setConsultantQuestion] = useState('')
  const [reply, setReply] = useState('')
  const [finalReply, setFinalReply] = useState('')
  const [jobStatus, setJobStatus] = useState<number>(QuestionStatusesE.New)
  const [categoryId, setCategoryId] = useState<string>('')

  const [consultantLoading, setConsultantLoading] = useState(false)
  const [grokLoading, setGrokLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [metaSaving, setMetaSaving] = useState(false)

  const [files, setFiles] = useState<File[]>([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const lastMessage = useMemo(() => {
    if (jobs.length > 1) return jobs[jobs.length - 1]
    return record
  }, [jobs, record])

  const childId = lastMessage?.id
  const lawyerAttachments = (attachmentsMap[String(childId)] ?? []).filter(
    (a) => a.source === 'lawyer',
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [rec, thread, atts] = await Promise.all([
      fetchRequestRecord(requestId),
      fetchRequestThread(requestId),
      fetchAttachmentsMap(requestId),
    ])
    if (!rec) {
      setError('Заявка не найдена')
      setLoading(false)
      return
    }
    setRecord(rec)
    setJobs(thread.jobs.length ? thread.jobs : [rec])
    setAttachmentsMap(atts)
    const last = thread.jobs.length > 1 ? thread.jobs[thread.jobs.length - 1] : rec
    setConsultantQuestion(last.question ?? '')
    setReply(last.reply ?? '')
    setFinalReply(last.final_reply ?? '')
    setJobStatus(rec.job_status ?? QuestionStatusesE.New)
    setCategoryId(rec.category_id ? String(rec.category_id) : '')
    setLoading(false)
  }, [requestId])

  useEffect(() => {
    void reload()
    void fetchCategories().then(setCategories)
  }, [reload])

  const buildPayload = (extra: Record<string, unknown> = {}) => ({
    ...record,
    child_id: childId,
    reply_id: lastMessage?.reply_id,
    final_reply_id: lastMessage?.final_reply_id,
    consultant_question: consultantQuestion,
    reply,
    final_reply: finalReply,
    job_status: jobStatus,
    ...extra,
  })

  const handleConsultant = async () => {
    const q = consultantQuestion.trim()
    if (!q) {
      toast.warning('Заполните поле «Последний вопрос».')
      return
    }
    setConsultantLoading(true)
    const res = await runConsultantPlus(q)
    setConsultantLoading(false)
    if (!res.ok) {
      toast.error(res.error || 'Ошибка Консультант+')
      return
    }
    setReply(consultantAnswerToHtml(res.reply ?? ''))
    toast.success('Ответ от Консультант+ получен.')
  }

  const handleGrok = async () => {
    if (!record) return
    if (!plainText(reply)) {
      toast.warning('Нужен текст ответа Консультант+ для обработки в Grok.')
      return
    }
    setGrokLoading(true)
    const res = await saveRequest(record.id, buildPayload({ isGenerate: true }))
    setGrokLoading(false)
    if (!res.ok) {
      toast.error(res.error || 'Ошибка Grok')
      return
    }
    toast.success('Информация обработана!')
    await reload()
  }

  const handleSave = async () => {
    if (!record) return
    setSaveLoading(true)
    const res = await saveRequest(record.id, buildPayload({ isGenerate: false }))
    setSaveLoading(false)
    if (!res.ok) {
      toast.error(res.error || 'Не удалось сохранить')
      return
    }
    toast.success('Сохранено')
    await reload()
  }

  const handleMetaSave = async () => {
    if (!record) return
    setMetaSaving(true)
    const res = await saveRequest(
      record.id,
      buildPayload({
        isGenerate: false,
        job_status: jobStatus,
      }),
    )
    setMetaSaving(false)
    if (!res.ok) {
      toast.error(res.error || 'Не удалось сохранить статус')
      return
    }
    toast.success('Статус обновлён')
    setMetaOpen(false)
    await reload()
  }

  const handlePdf = async () => {
    if (!record) return
    const pdfId = record.short_id ?? record.uuid
    const hasAnswer = plainText(finalReply).length > 0
    if (!pdfId || !hasAnswer || pdfLoading) return

    const viewer = window.open('', '_blank')
    if (viewer) {
      viewer.document.write(PDF_LOADING_HTML)
      viewer.document.close()
    }

    const answerChanged = plainText(finalReply) !== plainText(lastMessage?.final_reply)
    if (!answerChanged) {
      const url = `/api/pdf/${pdfId}`
      if (viewer) viewer.location.href = url
      else window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    setPdfLoading(true)
    try {
      const res = await fetch(`/api/pdf/${pdfId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyHtml: finalReply, childId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Не удалось сформировать PDF.')
      }
      const url = `/api/pdf/${pdfId}/draft`
      if (viewer) viewer.location.href = url
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      if (viewer) viewer.close()
      toast.warning((err as Error).message)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!childId || files.length === 0 || uploadLoading) return
    if (lawyerAttachments.length + files.length > ATTACH_MAX_FILES) {
      toast.warning(`Можно прикрепить не более ${ATTACH_MAX_FILES} файлов.`)
      return
    }
    setUploadLoading(true)
    const res = await uploadQuestionAttachmentsAction(childId, files, true)
    setUploadLoading(false)
    if (!res.ok) {
      toast.warning(res.error ?? 'Не удалось загрузить файлы.')
      return
    }
    toast.success('Файлы загружены.')
    setFiles([])
    setAttachmentsMap(await fetchAttachmentsMap(requestId))
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (deletingId) return
    setDeletingId(attachmentId)
    const res = await deleteQuestionAttachmentAction(attachmentId)
    setDeletingId(null)
    if (!res.ok) {
      toast.warning(res.error ?? 'Не удалось удалить файл.')
      return
    }
    toast.success('Файл удалён.')
    setAttachmentsMap(await fetchAttachmentsMap(requestId))
  }

  const handleDeleteCase = async () => {
    if (!isSuper || !record) return
    if (!window.confirm(`Удалить заявку #${record.id}?`)) return
    const res = await deleteRequest(record.id)
    if (!res.ok) {
      toast.error(res.error || 'Ошибка удаления')
      return
    }
    toast.success('Заявка удалена')
    router.push('/admin/requests')
  }

  if (loading) {
    return (
      <StaffGate>
        <main className={`v2-header-bleed ${styles.page}`}>
          <p className={styles.loading}>Загружаем заявку…</p>
        </main>
      </StaffGate>
    )
  }

  if (error || !record) {
    return (
      <StaffGate>
        <main className={`v2-header-bleed ${styles.page}`}>
          <p className={styles.error}>{error || 'Заявка не найдена'}</p>
          <div style={{ textAlign: 'center' }}>
            <Link href="/admin/requests" className={styles.backLink}>
              ← К списку заявок
            </Link>
          </div>
        </main>
      </StaffGate>
    )
  }

  return (
    <StaffGate>
      <main id="lawyer-request-detail" className={`v2-header-bleed ${styles.page}`}>
        <section className={styles.container}>
          <div className={styles.topBar}>
            <Link href="/admin/requests" className={styles.backLink}>
              ← К списку заявок
            </Link>
            <div className={styles.topActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setMetaOpen(true)}
              >
                Статус
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => void handlePdf()}
                disabled={!plainText(finalReply) || pdfLoading}
              >
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                PDF
              </button>
              {isSuper && (
                <button type="button" className={styles.btnDanger} onClick={() => void handleDeleteCase()}>
                  Удалить
                </button>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <RecordContextProvider value={record}>
              <AdminJobView record={record} jobs={jobs} attachmentsMap={attachmentsMap} />
            </RecordContextProvider>

            <div className={styles.form}>
              <div>
                <label className={styles.fieldLabel}>Последний вопрос</label>
                <textarea
                  className={styles.textarea}
                  value={consultantQuestion}
                  onChange={(e) => setConsultantQuestion(e.target.value)}
                />
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => void handleConsultant()}
                  disabled={consultantLoading}
                >
                  {consultantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Обработать в Консультант+
                </button>
              </div>

              <div>
                <label className={styles.fieldLabel}>Ответ от Консультант+</label>
                <textarea
                  className={styles.rich}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => void handleGrok()}
                  disabled={grokLoading}
                >
                  {grokLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Обработать в Grok
                </button>
              </div>

              <div>
                <label className={styles.fieldLabel}>Ответ пользователю</label>
                <textarea
                  className={styles.rich}
                  value={finalReply}
                  onChange={(e) => setFinalReply(e.target.value)}
                />
              </div>

              <div className={styles.attachBox}>
                <p className={styles.attachTitle}>Прикрепить файлы к ответу (только для юриста)</p>
                {lawyerAttachments.length > 0 && (
                  <div className={styles.attachList}>
                    {lawyerAttachments.map((att) => (
                      <div key={att.id} className={styles.attachItem}>
                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                          {att.filename}
                        </a>
                        <button
                          type="button"
                          className={listStyles.dangerBtn}
                          style={{ height: 32, padding: '0 10px' }}
                          onClick={() => void handleDeleteAttachment(att.id)}
                          disabled={deletingId === att.id}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <FileUpload
                  files={files}
                  onFilesChange={setFiles}
                  disabled={uploadLoading}
                  existingCount={lawyerAttachments.length}
                />
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => void handleUpload()}
                    disabled={uploadLoading || files.length === 0}
                  >
                    {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Загрузить файлы
                  </button>
                </div>
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => void handleSave()}
                  disabled={saveLoading}
                >
                  {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </section>

        <LawyerMetaModal
          open={metaOpen}
          jobStatus={jobStatus}
          categoryId={categoryId}
          categories={categories}
          saving={metaSaving}
          onJobStatusChange={setJobStatus}
          onSave={() => void handleMetaSave()}
          onClose={() => setMetaOpen(false)}
        />
      </main>
    </StaffGate>
  )
}
