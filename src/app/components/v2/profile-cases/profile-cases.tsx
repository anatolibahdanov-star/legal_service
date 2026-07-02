'use client'

import { useEffect, useState } from 'react'
import type { User } from 'next-auth'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, CreditCard, FileText, MessageCircle, Plus, Upload } from 'lucide-react'

import type { DBQuestion } from '@/src/interfaces/db'
import { QuestionStatusesE, dFormat, statusesDesign } from '@/src/interfaces/data'
import { CustomGetRequest } from '@/src/libs/request'
import RequestFormWindow from '@/src/app/components/popups/RequestFormWindow'
import PayQuestionWindow from '@/src/app/components/popups/PayQuestionWindow'

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
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeForm, setActiveForm] = useState<'new-question' | null>(null)
  const [payingQuestionId, setPayingQuestionId] = useState<string | number | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [refreshFlag, setRefreshFlag] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const domainUrl = process.env.NEXT_PUBLIC_URL ?? ''

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setLoading(true)
      const questionData = await CustomGetRequest('/requests', {
        page: currentPage,
        limit: itemsPerPage,
        sort: JSON.stringify(['id', 'DESC']),
        filter: JSON.stringify({ user_id: user.id }),
      })
      if (active && questionData.status) {
        setJobs(questionData.data ?? [])
        setTotalItems(questionData.count ?? 0)
      }
      if (active) setLoading(false)
    }
    fetchData()
    return () => {
      active = false
    }
  }, [currentPage, user.id, refreshToken, refreshFlag])

  const refresh = () => setRefreshToken((value) => value + 1)
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
                onClick={() => setFilter(item.id)}
                className={`rounded-[10px] px-4 text-[14px] font-semibold leading-5 transition-colors ${
                  filter === item.id ? 'bg-[#12161B] text-white' : 'text-[rgba(18,22,27,0.5)] hover:bg-[#F7F6F9]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 px-8 pb-8 pt-5">
          <button
            type="button"
            onClick={() => setActiveForm('new-question')}
            className="flex items-center gap-5 rounded-[24px] border-2 border-dashed border-[rgba(52,52,124,0.3)] bg-gradient-to-br from-[rgba(153,153,202,0.06)] to-[rgba(165,165,221,0.06)] p-6 text-left transition-colors hover:border-[#34347C]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-r from-[#34347C] to-[#34537C] text-white shadow-[0px_4px_16px_0px_rgba(52,52,124,0.15)]">
              <Plus className="h-[22px] w-[22px]" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[16px] font-semibold leading-5 text-[#34347C]">Создать новое обращение</span>
              <span className="text-[14px] leading-5 text-[rgba(18,22,27,0.6)]">Опытный юрист ответит в течение 24 часов</span>
            </span>
          </button>

        {filteredJobs.map((caseItem) => {
          const status = statusesDesign[caseItem.job_status] ?? statusesDesign[QuestionStatusesE.Disabled]
          const statusClass = statusClassName[caseItem.job_status] ?? statusClassName[QuestionStatusesE.Disabled]
          const consultationHref = `${domainUrl}/consultation/${caseItem.uuid}/`
          const currentWorkflowIndex = workflowIndexByStatus[caseItem.job_status] ?? 0
          const isWaiting = caseItem.job_status === QuestionStatusesE.New || caseItem.job_status === QuestionStatusesE.Unpaid
          const isDone = caseItem.job_status === QuestionStatusesE.Approved

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
                        <span className={`text-[12px] font-medium leading-[17px] ${isWaiting ? 'text-[#FE9A00]' : isDone ? 'text-[rgba(18,22,27,0.6)]' : 'text-[#FB2C36]'}`}>
                          {isWaiting ? 'Средний' : isDone ? 'Низкий' : 'Высокий'}
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
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-[12px] font-semibold text-white">
                        {isWaiting ? 'МВ' : isDone ? 'ЕП' : 'АС'}
                      </span>
                      <span className="text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.6)]">
                        {isWaiting ? 'Михаил Волков' : isDone ? 'Елена Попова' : 'Анна Смирнова'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[14px] leading-5 text-[rgba(18,22,27,0.5)]">
                      <MessageCircle className="h-4 w-4" />
                      {isWaiting ? 1 : isDone ? 8 : 3}
                    </span>
                  </div>
                  {caseItem.job_status === QuestionStatusesE.Unpaid ? (
                    <button
                      type="button"
                      onClick={() => setPayingQuestionId(caseItem.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#12161B] px-4 py-2 text-[14px] font-semibold leading-5 text-white shadow-[0px_4px_20px_0px_rgba(47,47,113,0.15)]"
                    >
                      <CreditCard className="h-4 w-4" />
                      Оплатить
                    </button>
                  ) : isWaiting ? (
                    <Link
                      href={consultationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#FE9A00] px-4 py-2 text-[14px] font-semibold leading-5 text-white shadow-[0px_4px_12px_0px_rgba(13,13,30,0.15)]"
                    >
                      Ответить юристу
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : isDone ? (
                    <Link
                      href={consultationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[rgba(18,22,27,0.05)] px-4 py-2 text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.5)]"
                    >
                      Открыть
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href={consultationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#12161B] px-4 py-2 text-[14px] font-semibold leading-5 text-white shadow-[0px_4px_20px_0px_rgba(47,47,113,0.15)]"
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
                className={`h-10 min-w-10 rounded-[14px] px-3 text-[14px] font-medium transition-colors ${
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

      <RequestFormWindow
        isOpen={activeForm === 'new-question'}
        onClose={() => {
          setActiveForm(null)
          refresh()
        }}
        setCurrent={setRefreshFlag}
        setPage={setCurrentPage}
      />
      <PayQuestionWindow
        isOpen={payingQuestionId !== null}
        questionId={payingQuestionId}
        onClose={() => setPayingQuestionId(null)}
        onPaid={() => {
          setPayingQuestionId(null)
          refresh()
        }}
      />
    </div>
  )
}
