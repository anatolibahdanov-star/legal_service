'use client'

import { useEffect, useState } from 'react'
import type { User } from 'next-auth'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowRight, CreditCard, Eye, FileText, Paperclip, Plus, Share2, Star, Upload } from 'lucide-react'

import type { DBQuestion } from '@/src/interfaces/db'
import { QuestionStatusesE, dFormat, statusesDesign } from '@/src/interfaces/data'
import { CustomGetRequest } from '@/src/libs/request'
import PayQuestionWindow from '@/src/app/components/popups/PayQuestionWindow'
import { CaseModal } from '@/src/app/components/popups/CaseModal'
import { PdfActionsModal, PdfIcon, PdfSuccessModal, type PdfShareChannel } from '@/src/app/components/popups/pdf'
import { InquirySection } from '@/src/app/components/v2/inquiry-section/inquiry-section'

interface V2ProfileCasesProps {
  user: User
}

const itemsPerPage = 6

const statusClassName: Record<QuestionStatusesE, string> = {
  [QuestionStatusesE.Disabled]: 'bg-red-50 text-red-700',
  [QuestionStatusesE.New]: 'bg-[#FFFBEB] text-[#BB4D00]',
  [QuestionStatusesE.InProgress]: 'bg-[rgba(153,153,202,0.15)] text-[#34347C]',
  [QuestionStatusesE.Spam]: 'bg-red-50 text-red-700',
  [QuestionStatusesE.Approved]: 'bg-[rgba(22,163,74,0.12)] text-[#007A55]',
  [QuestionStatusesE.Unpaid]: 'bg-slate-100 text-slate-600',
}

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'work', label: 'В работе' },
  { id: 'wait', label: 'Ожидает ответа' },
  { id: 'done', label: 'Завершено' },
] as const

const workflowSteps = ['Создано', 'Принято', 'В работе', 'Проверка', 'Закрыто']

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

const workflowIndexByStatus: Record<QuestionStatusesE, number> = {
  [QuestionStatusesE.Disabled]: 0,
  [QuestionStatusesE.New]: 1,
  [QuestionStatusesE.InProgress]: 2,
  [QuestionStatusesE.Spam]: 0,
  [QuestionStatusesE.Approved]: 4,
  [QuestionStatusesE.Unpaid]: 0,
}

export function V2ProfileCases({ user }: V2ProfileCasesProps) {
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
      // Fetch the full list once and paginate/filter on the client. Status
      // filters (e.g. «Ожидает» = New | Unpaid) can't be expressed as a
      // server equality filter, so client-side keeps filter + pagination
      // consistent (a personal cabinet holds a small number of cases).
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

  const selectFilter = (id: (typeof FILTERS)[number]['id']) => {
    setFilter(id)
    setCurrentPage(1)
  }
  // const stats = {
  //   total: totalItems || jobs.length,
  //   work: jobs.filter((item) => item.job_status === QuestionStatusesE.InProgress).length,
  //   wait: jobs.filter((item) => item.job_status === QuestionStatusesE.New || item.job_status === QuestionStatusesE.Unpaid).length,
  //   done: jobs.filter((item) => item.job_status === QuestionStatusesE.Approved).length,
  // }

  const filteredJobs = jobs.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'work') return item.job_status === QuestionStatusesE.InProgress
    if (filter === 'wait') return item.job_status === QuestionStatusesE.New || item.job_status === QuestionStatusesE.Unpaid
    return item.job_status === QuestionStatusesE.Approved
  })

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage))
  const pageJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="flex w-full flex-col gap-12">
      {/* <div className="flex items-center justify-between gap-8">
        {[
          { label: 'Всего', value: stats.total, bg: '#34347C', icon: '#4242A1', text: 'text-white', sub: 'text-white/80', width: 171 },
          { label: 'В работе', value: stats.work, bg: '#D8D054', icon: '#E9E15B', text: 'text-[#12161B]', sub: 'text-[rgba(18,22,27,0.7)]', width: 190 },
          { label: 'Ожидает', value: stats.wait, bg: '#C44021', icon: '#DE4927', text: 'text-white', sub: 'text-white/80', width: 203 },
          { label: 'Завершено', value: stats.done, bg: '#183E35', icon: '#205246', text: 'text-white', sub: 'text-white/80', width: 210 },
        ].map((item) => (
          <div
            key={item.label}
            className="flex h-[76px] shrink-0 items-center gap-3 rounded-[16px] border border-white/10 p-[10px] pr-4 shadow-[0px_10px_28px_0px_rgba(21,22,25,0.16)]"
            style={{ width: item.width, background: item.bg }}
          >
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[8px] border border-white/35 text-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.12)] backdrop-blur-md" style={{ background: item.icon }}>
              <Briefcase className="h-[30px] w-[30px]" strokeWidth={1.7} />
            </div>
            <div className="flex min-w-0 items-end gap-2">
              <span className={`text-[44px] font-medium leading-[48px] tracking-[-0.03em] ${item.text}`}>
                {item.value}
              </span>
              <span className={`pb-[8px] text-[12px] font-semibold leading-[14px] ${item.sub}`}>{item.label}</span>
            </div>
          </div>
        ))}
      </div> */}

      <div className="overflow-hidden rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
        <div className="flex items-center justify-between px-8 pb-5 pt-8">
          <div className="flex h-10 items-stretch gap-3">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectFilter(item.id)}
                className={`rounded-[10px] px-4 text-[14px] font-semibold leading-5 transition-colors cursor-pointer active:scale-[0.97] ${
                  filter === item.id ? 'bg-[#12161B] text-white' : 'text-[rgba(18,22,27,0.5)] hover:bg-[#F7F6F9]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 px-8 pb-8 pt-5">
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
              className="flex items-center gap-5 rounded-[24px] border-2 border-dashed border-[rgba(52,52,124,0.3)] bg-gradient-to-br from-[rgba(153,153,202,0.06)] to-[rgba(165,165,221,0.06)] p-6 text-left transition-colors cursor-pointer hover:border-[#34347C] hover:bg-[rgba(52,52,124,0.04)] active:bg-[rgba(52,52,124,0.08)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-r from-[#34347C] to-[#34537C] text-white shadow-[0px_4px_16px_0px_rgba(52,52,124,0.15)]">
                <Plus className="h-[22px] w-[22px]" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[16px] font-semibold leading-5 text-[#34347C]">Создать новое обращение</span>
                <span className="text-[14px] leading-5 text-[rgba(18,22,27,0.6)]">Опытный юрист ответит в течение 24 часов</span>
              </span>
            </button>
          )}

        {pageJobs.map((caseItem) => {
          const status = statusesDesign[caseItem.job_status] ?? statusesDesign[QuestionStatusesE.Disabled]
          const statusClass = statusClassName[caseItem.job_status] ?? statusClassName[QuestionStatusesE.Disabled]
          const consultationHref = `${domainUrl}/consultation/${caseItem.uuid}/`
          const currentWorkflowIndex = workflowIndexByStatus[caseItem.job_status] ?? 0
          const isWaiting = caseItem.job_status === QuestionStatusesE.New || caseItem.job_status === QuestionStatusesE.Unpaid
          const isDone = caseItem.job_status === QuestionStatusesE.Approved
          const lawyerName = caseItem.owner || caseItem.lawyer || ''
          const lawyerInitials = getInitials(lawyerName)
          const attachmentsCount = caseItem.attachments?.length ?? 0

          return (
            <article
              key={caseItem.id}
              className={`overflow-hidden rounded-[24px] border border-[rgba(18,22,27,0.05)] ${isDone ? 'bg-[#F9F9F9]' : 'bg-white'}`}
            >
              <div className="flex gap-5 p-6 pb-[18px]">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${isDone ? 'bg-gradient-to-br from-[rgba(153,153,202,0.06)] to-[rgba(165,165,221,0.06)]' : 'bg-gradient-to-br from-[rgba(153,153,202,0.15)] to-[rgba(165,165,221,0.15)]'} text-[#34347C]`}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex min-w-0 flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-md bg-[rgba(18,22,27,0.05)] px-2 py-1 text-[12px] font-medium leading-[17px] text-[rgba(18,22,27,0.5)]">
                          ENK-{caseItem.id}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium leading-[17px] ${statusClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {status.name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href={consultationHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`line-clamp-2 text-[16px] font-semibold leading-5 ${isDone ? 'text-[rgba(18,22,27,0.6)]' : 'text-[#12161B]'} transition-colors hover:text-[#34347C]`}
                        >
                          {caseItem.question}
                        </Link>
                        <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.6)]">
                          {caseItem.category_name || 'Без категории'}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[14px] leading-5 text-[rgba(18,22,27,0.5)]">
                      {format(new Date(caseItem.created_at), dFormat)}
                    </span>
                  </div>

                  <p className="my-4 py-4 text-[14px] leading-5 text-[rgba(18,22,27,0.6)]">
                    {caseItem.question}
                  </p>

                  {!isDone && (
                    <div className="flex items-stretch">
                      {workflowSteps.map((step, index) => {
                        const active = index <= currentWorkflowIndex
                        return (
                          <div key={step} className="flex flex-1 flex-col items-center gap-1">
                            <div className={`h-4 w-4 rounded-full border ${active ? 'border-white bg-gradient-to-r from-[#34347C] to-[#34537C]' : 'border-[rgba(18,22,27,0.05)] bg-[rgba(18,22,27,0.15)]'}`} />
                            <span className={`text-[8px] font-semibold leading-[14px] ${active ? 'text-[rgba(48,48,115,0.75)]' : 'text-[rgba(18,22,27,0.35)]'}`}>
                              {step}
                            </span>
                            {index < workflowSteps.length - 1 && (
                              <div className={`mt-[-27px] h-0 w-full translate-x-1/2 border-t-2 border-dashed ${active ? 'border-[#34347C]' : 'border-[rgba(18,22,27,0.35)]'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex w-[260px] shrink-0 flex-col items-end justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {lawyerName ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-[12px] font-semibold text-white">
                          {lawyerInitials}
                        </span>
                        <span className="text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.6)]">
                          {lawyerName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[14px] leading-5 text-[rgba(18,22,27,0.4)]">
                        Юрист не назначен
                      </span>
                    )}
                    {attachmentsCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-[14px] leading-5 text-[rgba(18,22,27,0.5)]">
                        <Paperclip className="h-4 w-4" />
                        {attachmentsCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCase(caseItem)}
                      title="Открыть чат с юристом"
                      aria-label="Открыть чат с юристом"
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(18,22,27,0.1)] text-[rgba(18,22,27,0.6)] transition-colors cursor-pointer hover:border-[#34347C] hover:text-[#34347C] active:scale-95"
                    >
                      <Eye className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCase(caseItem, true)}
                      title={caseItem.rating ? `Изменить оценку (${caseItem.rating})` : 'Оценить юриста'}
                      aria-label="Оценить юриста"
                      className={`relative flex h-9 w-9 items-center justify-center rounded-[10px] border transition-colors cursor-pointer active:scale-95 ${
                        caseItem.rating
                          ? 'border-[#16A34A] text-[#16A34A] hover:bg-[rgba(22,163,74,0.08)]'
                          : 'border-[rgba(18,22,27,0.1)] text-[rgba(18,22,27,0.6)] hover:border-[#34347C] hover:text-[#34347C]'
                      }`}
                    >
                      <Star className={`h-[18px] w-[18px] ${caseItem.rating ? 'fill-[#16A34A]' : ''}`} />
                      {!!caseItem.rating && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16A34A] px-1 text-[10px] font-bold text-white">
                          {caseItem.rating}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => shareCase(caseItem)}
                      title="Поделиться ссылкой"
                      aria-label="Поделиться ссылкой"
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(18,22,27,0.1)] text-[rgba(18,22,27,0.6)] transition-colors cursor-pointer hover:border-[#34347C] hover:text-[#34347C] active:scale-95"
                    >
                      <Share2 className="h-[18px] w-[18px]" />
                    </button>
                    {(() => {
                      const canPdf = caseItem.job_status === QuestionStatusesE.Approved
                      return (
                        <button
                          type="button"
                          onClick={() => canPdf && openPdf(caseItem)}
                          disabled={!canPdf}
                          title={canPdf ? 'Действия с PDF' : 'PDF будет доступен после ответа юриста'}
                          aria-label="Действия с PDF"
                          className={`flex h-9 w-9 items-center justify-center rounded-[10px] border transition-colors ${
                            canPdf
                              ? 'border-[rgba(18,22,27,0.1)] text-[rgba(18,22,27,0.6)] cursor-pointer hover:border-[#FB2C36] hover:text-[#FB2C36] active:scale-95'
                              : 'cursor-not-allowed border-[rgba(18,22,27,0.05)] text-[rgba(18,22,27,0.25)]'
                          }`}
                        >
                          <PdfIcon />
                        </button>
                      )
                    })()}
                  </div>
                  {caseItem.job_status === QuestionStatusesE.Unpaid ? (
                    <button
                      type="button"
                      onClick={() => setPayingQuestionId(caseItem.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#12161B] px-4 py-2 text-[14px] font-semibold leading-5 text-white shadow-[0px_4px_20px_0px_rgba(47,47,113,0.15)] transition-opacity cursor-pointer hover:opacity-90 active:opacity-80"
                    >
                      <CreditCard className="h-4 w-4" />
                      Оплатить
                    </button>
                  ) : isWaiting ? (
                    <Link
                      href={consultationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#FE9A00] px-4 py-2 text-[14px] font-semibold leading-5 text-white shadow-[0px_4px_12px_0px_rgba(13,13,30,0.15)] transition-opacity cursor-pointer hover:opacity-90 active:opacity-80"
                    >
                      Ответить юристу
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : isDone ? (
                    <button
                      type="button"
                      onClick={() => openCase(caseItem)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[rgba(18,22,27,0.05)] px-4 py-2 text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.5)] transition-colors cursor-pointer hover:bg-[rgba(18,22,27,0.1)] active:bg-[rgba(18,22,27,0.15)]"
                    >
                      Открыть
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link
                      href={consultationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#12161B] px-4 py-2 text-[14px] font-semibold leading-5 text-white shadow-[0px_4px_20px_0px_rgba(47,47,113,0.15)] transition-opacity hover:opacity-90 active:opacity-80"
                    >
                      Загрузить документы
                      <Upload className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
              {isWaiting && (
                <div className="flex items-center gap-2 border-t border-[rgba(18,22,27,0.05)] bg-[#FFFBEB] px-6 py-3 text-[12px] font-medium leading-[17px] text-[#BB4D00]">
                  Юрист ожидает ваших документов — загрузите их, чтобы продолжить
                </div>
              )}
            </article>
          )
        })}

        {!loading && filteredJobs.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-[rgba(18,22,27,0.16)] bg-white p-10 text-center">
            <p className="text-[18px] font-semibold text-[#12161B]">Заявок пока нет</p>
            <p className="mt-2 text-[14px] text-[rgba(18,22,27,0.55)]">Задайте первый вопрос юристу.</p>
          </div>
        )}

        {loading && (
          <div className="rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white p-8 text-center text-[14px] text-[rgba(18,22,27,0.55)]">
            Загружаем заявки...
          </div>
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1
            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-10 min-w-10 rounded-[14px] px-3 text-[14px] font-medium transition-colors cursor-pointer active:scale-95 ${
                  currentPage === page
                    ? 'bg-[#34347C] text-white'
                    : 'bg-white text-[#12161B] hover:bg-[#F7F6F9]'
                }`}
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
        <CaseModal
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
