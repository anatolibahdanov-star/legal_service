'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from 'next-auth'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowRight, CreditCard, Eye, FileText, Paperclip, Plus, Share2, Star } from 'lucide-react'

import type { DBQuestion } from '@/src/interfaces/db'
import { QuestionStatusesE, dFormat, statusesDesign } from '@/src/interfaces/data'
import { CustomGetRequest } from '@/src/libs/request'
import PayQuestionWindow from '@/src/app/components/popups/PayQuestionWindow'
import { V2CaseModal } from '@/src/app/components/v2/case-modal/case-modal'
import { PdfActionsModal, PdfIcon, PdfSuccessModal, type PdfShareChannel } from '@/src/app/components/popups/pdf'
import { InquirySection } from '@/src/app/components/v2/inquiry-section/inquiry-section'
import styles from './profile-cases.module.css'

interface V2ProfileCasesProps {
  user: User
}

const itemsPerPage = 6

const statusClassName: Record<QuestionStatusesE, string> = {
  [QuestionStatusesE.Disabled]: styles.statusDisabled,
  [QuestionStatusesE.New]: styles.statusNew,
  [QuestionStatusesE.InProgress]: styles.statusInProgress,
  [QuestionStatusesE.Spam]: styles.statusSpam,
  [QuestionStatusesE.Approved]: styles.statusApproved,
  [QuestionStatusesE.Unpaid]: styles.statusUnpaid,
}

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'work', label: 'В работе' },
  { id: 'wait', label: 'Ожидает ответа' },
  { id: 'done', label: 'Завершено' },
] as const

const getInitials = (value: string) => {
  const source = value.trim()
  if (!source) return ''
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const getJobStatus = (item: DBQuestion): QuestionStatusesE =>
  Number(item.job_status) as QuestionStatusesE

export function V2ProfileCases({ user }: V2ProfileCasesProps) {
  const listTopRef = useRef<HTMLDivElement>(null)
  const [jobs, setJobs] = useState<DBQuestion[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [activeForm, setActiveForm] = useState<'new-question' | null>(null)
  const [payingQuestionId, setPayingQuestionId] = useState<string | number | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [selectedCase, setSelectedCase] = useState<DBQuestion | null>(null)
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false)
  const [openRatingSection, setOpenRatingSection] = useState(false)
  const [pdfCase, setPdfCase] = useState<DBQuestion | null>(null)
  const [pdfHasCached, setPdfHasCached] = useState(false)
  const [pdfSuccess, setPdfSuccess] = useState<{
    questionId: string | number
    questionDate: string
    channel: PdfShareChannel
  } | null>(null)
  const domainUrl = process.env.NEXT_PUBLIC_URL ?? ''

  const openCase = (caseItem: DBQuestion, withRating = false) => {
    setSelectedCase(caseItem)
    setOpenRatingSection(withRating)
    setIsCaseModalOpen(true)
  }

  const closeCase = () => {
    setIsCaseModalOpen(false)
    setOpenRatingSection(false)
    refresh()
    setTimeout(() => setSelectedCase(null), 300)
  }

  const shareCase = (caseItem: DBQuestion) => {
    const link = `${domainUrl}/consultation/${caseItem.uuid}/`
    navigator.clipboard.writeText(link)
    toast.success('Ссылка на консультацию скопирована')
  }

  const openPdf = (caseItem: DBQuestion) => {
    setPdfHasCached(false)
    setPdfCase(caseItem)
    const pdfKey = (caseItem as DBQuestion & { short_id?: string }).short_id ?? caseItem.uuid
    fetch(`/api/pdf/${pdfKey}/exists`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPdfHasCached(!!d?.exists))
      .catch(() => {})
  }

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setLoading(true)
      const questionData = await CustomGetRequest('/requests', {
        page: 1,
        limit: 1000,
        sort: JSON.stringify(['id', 'DESC']),
        filter: JSON.stringify({ user_id: user.id }),
      })
      if (active && questionData.status) {
        setJobs(questionData.data ?? [])
      }
      if (active) setLoading(false)
    }
    fetchData()
    return () => {
      active = false
    }
  }, [user.id, refreshToken])

  const refresh = () => setRefreshToken((value) => value + 1)

  const scrollToCasesTop = useCallback(() => {
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const selectFilter = (id: (typeof FILTERS)[number]['id']) => {
    setFilter(id)
    setCurrentPage(1)
    requestAnimationFrame(() => scrollToCasesTop())
  }

  const selectPage = (page: number) => {
    if (page === currentPage) return
    setCurrentPage(page)
    requestAnimationFrame(() => scrollToCasesTop())
  }

  const filteredJobs = jobs.filter((item) => {
    const status = getJobStatus(item)
    if (filter === 'all') return true
    if (filter === 'work') return status === QuestionStatusesE.InProgress
    if (filter === 'wait') {
      return status === QuestionStatusesE.New || status === QuestionStatusesE.Unpaid
    }
    return status === QuestionStatusesE.Approved
  })

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage))
  const pageJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div ref={listTopRef} className={`${styles.root} ${styles.listScrollAnchor}`}>
      <div className={styles.card}>
        <div className={styles.filtersHeader}>
          <div className={styles.filters}>
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectFilter(item.id)}
                className={`${styles.filterBtn} ${filter === item.id ? styles.filterBtnActive : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          {activeForm === 'new-question' ? (
            <InquirySection
              variant="inline"
              onClose={() => {
                setActiveForm(null)
                refresh()
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setActiveForm('new-question')}
              className={styles.createBtn}
            >
              <span className={styles.createIcon}>
                <Plus className={styles.createIconSvg} />
              </span>
              <span className={styles.createText}>
                <span className={styles.createTitle}>Создать новое обращение</span>
                <span className={styles.createSubtitle}>Опытный юрист ответит в течение 24 часов</span>
              </span>
            </button>
          )}

        {pageJobs.map((caseItem) => {
          const jobStatus = getJobStatus(caseItem)
          const status = statusesDesign[jobStatus] ?? statusesDesign[QuestionStatusesE.Disabled]
          const statusClass = statusClassName[jobStatus] ?? statusClassName[QuestionStatusesE.Disabled]
          const isWaiting = jobStatus === QuestionStatusesE.New
          const isDone = jobStatus === QuestionStatusesE.Approved
          const lawyerName = caseItem.owner || caseItem.lawyer || ''
          const lawyerInitials = getInitials(lawyerName)
          const attachmentsCount = caseItem.attachments?.length ?? 0

          return (
            <article
              key={caseItem.id}
              className={`${styles.caseCard} ${isDone ? styles.caseCardDone : ''}`}
            >
              <div className={styles.caseTop}>
                <div className={`${styles.caseIcon} ${isDone ? styles.caseIconDone : ''}`}>
                  <FileText className={styles.caseIconSvg} />
                </div>
                <div className={styles.caseMain}>
                  <div className={styles.caseHeader}>
                    <div className={styles.caseBadges}>
                      <span className={styles.caseId}>ENK-{caseItem.id}</span>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        <span className={styles.statusDot} />
                        {status.name}
                      </span>
                    </div>
                    <div className={styles.caseHeaderRight}>
                      <span className={styles.caseDate}>
                        {format(new Date(caseItem.created_at), dFormat)}
                      </span>
                      {lawyerName ? (
                        <div className={styles.lawyer}>
                          <span className={styles.lawyerAvatar}>{lawyerInitials}</span>
                          <span className={styles.lawyerName}>{lawyerName}</span>
                        </div>
                      ) : (
                        <span className={styles.lawyerEmpty}>Юрист не назначен</span>
                      )}
                      {attachmentsCount > 0 && (
                        <span className={styles.attachments}>
                          <Paperclip className={styles.attachmentsIcon} />
                          {attachmentsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.caseTextRow}>
                    <div className={styles.caseTitleCol}>
                      <button
                        type="button"
                        onClick={() => openCase(caseItem)}
                        title={caseItem.question}
                        className={`${styles.caseTitleLink} ${isDone ? styles.caseTitleLinkDone : ''}`}
                      >
                        {caseItem.question}
                      </button>
                      <p className={styles.caseDescription}>
                        {caseItem.question}
                      </p>
                      {caseItem.category_name?.trim() ? (
                        <span className={styles.caseCategory}>
                          {caseItem.category_name}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => openCase(caseItem)}
                        title="Открыть чат с юристом"
                        aria-label="Открыть чат с юристом"
                        className={styles.actionBtn}
                      >
                        <Eye className={styles.actionIcon} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openCase(caseItem, true)}
                        title={caseItem.rating ? `Изменить оценку (${caseItem.rating})` : 'Оценить юриста'}
                        aria-label="Оценить юриста"
                        className={`${styles.actionBtn} ${caseItem.rating ? styles.actionBtnRated : ''}`}
                      >
                        <Star className={`${styles.actionIcon} ${caseItem.rating ? styles.starFilled : ''}`} />
                        {!!caseItem.rating && (
                          <span className={styles.ratingBadge}>{caseItem.rating}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => shareCase(caseItem)}
                        title="Поделиться ссылкой"
                        aria-label="Поделиться ссылкой"
                        className={styles.actionBtn}
                      >
                        <Share2 className={styles.actionIcon} />
                      </button>
                      {(() => {
                        const canPdf = jobStatus === QuestionStatusesE.Approved
                        return (
                          <button
                            type="button"
                            onClick={() => canPdf && openPdf(caseItem)}
                            disabled={!canPdf}
                            title={canPdf ? 'Действия с PDF' : 'PDF будет доступен после ответа юриста'}
                            aria-label="Действия с PDF"
                            className={`${styles.actionBtn} ${canPdf ? styles.actionBtnPdf : styles.actionBtnDisabled}`}
                          >
                            <PdfIcon />
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.caseFooter}>
                <div className={styles.caseFooterCta}>
                  {jobStatus === QuestionStatusesE.Unpaid ? (
                    <button
                      type="button"
                      onClick={() => setPayingQuestionId(caseItem.id)}
                      className={`${styles.ctaBtn} ${styles.ctaPrimary}`}
                    >
                      <CreditCard className={styles.ctaBtnIcon} />
                      Оплатить
                    </button>
                  ) : isWaiting ? (
                    <button
                      type="button"
                      onClick={() => openCase(caseItem)}
                      className={`${styles.ctaBtn} ${styles.ctaWaiting}`}
                    >
                      Открыть
                      <ArrowRight className={styles.ctaBtnIcon} />
                    </button>
                  ) : isDone ? (
                    <button
                      type="button"
                      onClick={() => openCase(caseItem)}
                      className={`${styles.ctaBtn} ${styles.ctaDone}`}
                    >
                      Открыть
                      <ArrowRight className={styles.ctaBtnIcon} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCase(caseItem)}
                      className={`${styles.ctaBtn} ${styles.ctaPrimary}`}
                    >
                      Открыть
                      <ArrowRight className={styles.ctaBtnIcon} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {!loading && filteredJobs.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Заявок пока нет</p>
            <p className={styles.emptyText}>Задайте первый вопрос юристу.</p>
          </div>
        )}

        {loading && (
          <div className={styles.loadingState}>
            Загружаем заявки...
          </div>
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1
            return (
              <button
                key={page}
                type="button"
                onClick={() => selectPage(page)}
                className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
              >
                {page}
              </button>
            )
          })}
        </div>
      )}

      <PayQuestionWindow
        isOpen={payingQuestionId !== null}
        questionId={payingQuestionId}
        onClose={() => setPayingQuestionId(null)}
        onPaid={() => {
          setPayingQuestionId(null)
          refresh()
        }}
      />

      {selectedCase && (
        <V2CaseModal
          user={user}
          caseItem={selectedCase}
          isOpen={isCaseModalOpen}
          onClose={closeCase}
          openRatingSection={openRatingSection}
          openNewQuestionWindow={() => setActiveForm('new-question')}
        />
      )}

      {pdfCase && (
        <PdfActionsModal
          open={pdfCase !== null}
          onOpenChange={(v) => { if (!v) setPdfCase(null) }}
          questionId={pdfCase.id}
          questionUuid={pdfCase.uuid}
          questionDate={format(new Date(pdfCase.created_at), dFormat)}
          questionText={pdfCase.question}
          hasPdf={pdfHasCached}
          shareLink={`${domainUrl}/api/pdf/${(pdfCase as DBQuestion & { short_id?: string }).short_id ?? pdfCase.uuid}`}
          onDownload={async () => {
            const pdfKey = (pdfCase as DBQuestion & { short_id?: string }).short_id ?? pdfCase.uuid
            const a = document.createElement('a')
            a.href = `/api/pdf/${pdfKey}?download=1`
            a.download = `enki-answer-${pdfCase.id}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            toast.success('PDF загружается')
          }}
          onPreview={async () => {
            const pdfKey = (pdfCase as DBQuestion & { short_id?: string }).short_id ?? pdfCase.uuid
            window.open(`/api/pdf/${pdfKey}`, '_blank', 'noopener,noreferrer')
            toast.success('Предпросмотр открыт в новой вкладке')
          }}
          onSendSms={async (phone) => {
            const pdfKey = (pdfCase as DBQuestion & { short_id?: string }).short_id ?? pdfCase.uuid
            const res = await fetch(`/api/pdf/${pdfKey}/sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone }),
            })
            if (!res.ok) {
              const errData = await res.json().catch(() => null)
              throw new Error(errData?.message ?? 'Не удалось отправить SMS.')
            }
            toast.success('SMS отправлено')
          }}
          onSendEmail={async (email) => {
            const pdfKey = (pdfCase as DBQuestion & { short_id?: string }).short_id ?? pdfCase.uuid
            const res = await fetch(`/api/pdf/${pdfKey}/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            })
            if (!res.ok) {
              const errData = await res.json().catch(() => null)
              throw new Error(errData?.message ?? 'Не удалось отправить email.')
            }
            toast.success('Email отправлен')
          }}
          onCopyLink={async () => {
            const pdfKey = (pdfCase as DBQuestion & { short_id?: string }).short_id ?? pdfCase.uuid
            toast.success('Ссылка скопирована')
            return `${domainUrl}/api/pdf/${pdfKey}`
          }}
          onShareSuccess={(channel) => {
            const successData = {
              questionId: pdfCase.id,
              questionDate: format(new Date(pdfCase.created_at), dFormat),
              channel,
            }
            setPdfCase(null)
            setTimeout(() => setPdfSuccess(successData), 200)
          }}
        />
      )}

      <PdfSuccessModal
        open={pdfSuccess !== null}
        onOpenChange={(v) => { if (!v) setPdfSuccess(null) }}
        questionId={pdfSuccess?.questionId ?? ''}
        questionDate={pdfSuccess?.questionDate}
        message="PDF успешно отправлен"
      />
    </div>
  )
}
