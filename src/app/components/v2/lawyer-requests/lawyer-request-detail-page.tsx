'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { BriefcaseBusiness, CalendarDays, Loader2, UserRound } from 'lucide-react'

import { ChatMessage } from '@/src/app/components/data/ChatMessage'
import { FileUpload } from '@/src/app/components/forms/FileUpload'
import {
  deleteQuestionAttachmentAction,
  uploadQuestionAttachmentsAction,
} from '@/src/app/components/forms/action/attachments'
import { ATTACH_MAX_FILES } from '@/src/app/components/forms/validation/attachments'
import type { AttachmentDTO, DBQuestion } from '@/src/interfaces/db'
import { QuestionStatusesE } from '@/src/interfaces/data'

import { StaffGate } from './staff-gate'
import { ActionConfirmDialog, type ConfirmationAction } from './action-confirm-dialog'
import {
  claimRequest,
  consultantAnswerToHtml,
  deleteRequest,
  fetchAttachmentsMap,
  fetchRequestRecord,
  fetchRequestThread,
  releaseRequest,
  runConsultantPlus,
  saveRequest,
} from './lawyer-requests.api'
import styles from './lawyer-request-detail.module.css'

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
  const currentAdminId = session?.user?.id
  const isLawyer = session?.user?.role === 'lowyer'

  const [record, setRecord] = useState<DBQuestion | null>(null)
  const [jobs, setJobs] = useState<DBQuestion[]>([])
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, AttachmentDTO[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [consultantQuestion, setConsultantQuestion] = useState('')
  const [reply, setReply] = useState('')
  const [finalReply, setFinalReply] = useState('')

  const [consultantLoading, setConsultantLoading] = useState(false)
  const [grokLoading, setGrokLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(null)

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
  const isAssigned = record?.admin_id != null
  const isMine = isAssigned && String(record?.admin_id) === String(currentAdminId)
  const canRelease = isMine || (isAssigned && isSuper)
  const isAnswerReceived = record?.job_status === QuestionStatusesE.Approved
  const isUnpaid = record?.job_status === QuestionStatusesE.Unpaid
  const canSendAnswer = !isAnswerReceived && !isUnpaid

  const askConfirmation = (action: ConfirmationAction) => setConfirmation(action)

  const confirmPendingAction = () => {
    const action = confirmation
    setConfirmation(null)
    if (action) void action.run()
  }

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
    setLoading(false)
  }, [requestId])

  useEffect(() => {
    if (!isLawyer) return
    void reload()
  }, [reload, isLawyer])

  const buildPayload = (extra: Record<string, unknown> = {}) => ({
    ...record,
    child_id: childId,
    reply_id: lastMessage?.reply_id,
    final_reply_id: lastMessage?.final_reply_id,
    consultant_question: consultantQuestion,
    reply,
    final_reply: finalReply,
    job_status: record?.job_status,
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

  const ensureOwnership = async (): Promise<boolean> => {
    if (!record || !currentAdminId) return false
    if (String(record.admin_id) === String(currentAdminId)) return true
    if (record.admin_id != null) {
      toast.error(`Дело уже находится в работе у юриста ${record.owner || ''}.`.trim())
      return false
    }

    setAssignmentLoading(true)
    const claimed = await claimRequest(record.id)
    setAssignmentLoading(false)
    if (!claimed.ok) {
      toast.error(claimed.error || 'Не удалось взять дело в работу.')
      if (claimed.status === 409) await reload()
      return false
    }
    if (claimed.data) setRecord(claimed.data)
    toast.success('Дело закреплено за вами.')
    return true
  }

  const handleGrok = async () => {
    if (!record) return
    if (record.job_status === QuestionStatusesE.Unpaid) {
      toast.warning('Вопрос не оплачен — работа с ним недоступна.')
      return
    }
    if (!plainText(reply)) {
      toast.warning('Нужен текст ответа Консультант+ для обработки в Grok.')
      return
    }
    if (!(await ensureOwnership())) return
    setGrokLoading(true)
    const res = await saveRequest(record.id, buildPayload({
      isGenerate: true,
      job_status: QuestionStatusesE.InProgress,
    }))
    setGrokLoading(false)
    if (!res.ok) {
      toast.error(res.error || 'Ошибка Grok')
      return
    }
    toast.success('Информация обработана!')
    await reload()
  }

  const handleSendAnswer = async () => {
    if (!record) return
    if (record.job_status === QuestionStatusesE.Approved) {
      toast.warning('Ответ уже отправлен — дело завершено.')
      return
    }
    if (record.job_status === QuestionStatusesE.Unpaid) {
      toast.warning('Нельзя ответить на неоплаченный вопрос.')
      return
    }
    if (!plainText(finalReply)) {
      toast.warning('Добавьте ответ пользователю перед отправкой.')
      return
    }
    if (!(await ensureOwnership())) return
    setSendLoading(true)
    const res = await saveRequest(record.id, buildPayload({
      isGenerate: false,
      job_status: QuestionStatusesE.Approved,
    }))
    setSendLoading(false)
    if (!res.ok) {
      toast.error(res.error || 'Не удалось отправить ответ')
      return
    }
    toast.success('Ответ отправлен пользователю')
    await reload()
  }

  const handleAssignment = async (mode: 'claim' | 'release') => {
    if (!record || assignmentLoading) return
    setAssignmentLoading(true)
    const res = mode === 'claim'
      ? await claimRequest(record.id)
      : await releaseRequest(record.id)
    setAssignmentLoading(false)
    if (!res.ok) {
      toast.error(res.error || 'Не удалось изменить назначение.')
      if (res.status === 409) await reload()
      return
    }
    toast.success(mode === 'claim' ? 'Дело взято в работу.' : 'Назначение снято.')
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

    // Always regenerate draft for preview so template/layout changes
    // (dates, contacts, footer) are visible without editing the answer.
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
              {isSuper && (
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => askConfirmation({
                    title: 'Удалить заявку?',
                    description: `Заявка #${record.id} и связанные с ней данные будут удалены без возможности восстановления.`,
                    confirmLabel: 'Удалить заявку',
                    tone: 'danger',
                    run: handleDeleteCase,
                  })}
                >
                  Удалить
                </button>
              )}
            </div>
          </div>

          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <div>
                <p className={styles.eyebrow}>Заявка #{record.id}</p>
                <h1 className={styles.title}>Дело от {record.username || 'клиента'}</h1>
                <p className={styles.heroDescription}>
                  Вся переписка и инструменты подготовки ответа собраны на одной странице.
                </p>
              </div>
              <div className={styles.assignment}>
                {!isAssigned ? (
                  <button
                    type="button"
                    className={styles.assignmentBtn}
                    disabled={assignmentLoading}
                    onClick={() => askConfirmation({
                      title: 'Взять дело в работу?',
                      description: 'Дело будет закреплено за вами и появится в разделе «Мои дела».',
                      confirmLabel: 'Взять в работу',
                      run: () => handleAssignment('claim'),
                    })}
                  >
                    {assignmentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BriefcaseBusiness size={18} />}
                    Взять в работу
                  </button>
                ) : canRelease ? (
                  <button
                    type="button"
                    className={styles.releaseBtn}
                    disabled={assignmentLoading}
                    onClick={() => askConfirmation({
                      title: isMine ? 'Снять дело с себя?' : 'Снять назначенного юриста?',
                      description: isMine
                        ? 'Дело вернётся в общий список и станет доступно другим юристам.'
                        : `Юрист ${record.owner || ''} будет снят с дела, и оно вернётся в общий список.`,
                      confirmLabel: isMine ? 'Снять с себя' : 'Снять юриста',
                      tone: 'danger',
                      run: () => handleAssignment('release'),
                    })}
                  >
                    {assignmentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isMine ? 'Снять с себя' : 'Снять юриста'}
                  </button>
                ) : (
                  <button type="button" className={styles.assignedBtn} disabled>
                    <UserRound size={18} />
                    В работе у {record.owner || 'другого юриста'}
                  </button>
                )}
                <span className={`${styles.ownerLabel} ${!isAssigned ? styles.ownerUnassigned : ''}`}>
                  {isAssigned ? `Ответственный: ${record.owner || 'назначен'}` : 'Юрист пока не назначен'}
                </span>
              </div>
            </div>
            <div className={styles.heroMeta}>
              <span><CalendarDays size={17} />{format(new Date(record.created_at), 'dd.MM.yyyy, HH:mm')}</span>
              {/* <span><BriefcaseBusiness size={17} />{record.category_name || 'Без категории'}</span> */}
              <span><UserRound size={17} />{record.email || 'Email не указан'}</span>
            </div>
          </section>

          <section className={styles.historyCard}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>История обращения</p>
              <h2>Переписка с клиентом</h2>
            </div>
            <div className={styles.history}>
              {jobs.map((message) => (
                <ChatMessage
                  key={`user-reply-${message.id}`}
                  message={message}
                  isFromUser={false}
                  isAdmin
                  variant="v2"
                  showAttachments
                  attachments={attachmentsMap[String(message.id)]}
                />
              ))}
            </div>
          </section>

          <section className={styles.editorCard}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Подготовка ответа</p>
              <h2>Рабочая область юриста</h2>
            </div>
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
                  onClick={() => askConfirmation({
                    title: 'Отправить вопрос в Консультант+?',
                    description: 'Текущий текст вопроса будет отправлен на обработку, а поле ответа Консультант+ — обновлено.',
                    confirmLabel: 'Обработать',
                    run: handleConsultant,
                  })}
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
                  onClick={() => askConfirmation({
                    title: 'Обработать ответ в Grok?',
                    description: 'Ответ Консультант+ будет отправлен в Grok. Результат сохранится в заявке.',
                    confirmLabel: 'Обработать в Grok',
                    run: handleGrok,
                  })}
                  disabled={grokLoading || isUnpaid}
                  title={isUnpaid ? 'Вопрос не оплачен — работа с ним недоступна' : undefined}
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
                          className={styles.attachmentDelete}
                          onClick={() => askConfirmation({
                            title: 'Удалить вложение?',
                            description: `Файл «${att.filename}» будет удалён из ответа юриста.`,
                            confirmLabel: 'Удалить файл',
                            tone: 'danger',
                            run: () => handleDeleteAttachment(att.id),
                          })}
                          disabled={deletingId === att.id}
                          aria-label={`Удалить файл ${att.filename}`}
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
                    onClick={() => askConfirmation({
                      title: 'Загрузить выбранные файлы?',
                      description: `${files.length} файл(а) будет прикреплено к ответу юриста.`,
                      confirmLabel: 'Загрузить файлы',
                      run: handleUpload,
                    })}
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
                  className={styles.btnSecondary}
                  onClick={() => void handlePdf()}
                  disabled={!plainText(finalReply) || pdfLoading}
                >
                  {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Предпросмотр в PDF
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => askConfirmation({
                    title: 'Отправить ответ пользователю?',
                    description: 'Ответ будет сохранён, дело отмечено завершённым, а пользователь получит уведомление.',
                    confirmLabel: 'Отправить ответ',
                    run: handleSendAnswer,
                  })}
                  disabled={
                    sendLoading
                    || assignmentLoading
                    || !plainText(finalReply)
                    || !canSendAnswer
                  }
                  title={
                    isAnswerReceived
                      ? 'Дело завершено — ответ уже получен'
                      : isUnpaid
                        ? 'Нельзя ответить на неоплаченный вопрос'
                        : undefined
                  }
                >
                  {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Отправить ответ
                </button>
              </div>
            </div>
          </section>
        </section>

        <ActionConfirmDialog
          action={confirmation}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmPendingAction}
        />
      </main>
    </StaffGate>
  )
}
