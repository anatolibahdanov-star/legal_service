'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { DBOrder, DBQuestion, DBUser } from '@/src/interfaces/db'
import {
  AdminBalanceOperationI,
  AdminOperationTypeE,
  AlfaOrderStatusE,
  OrderTypeE,
} from '@/src/interfaces/payment'
import { QuestionStatusesE } from '@/src/interfaces/data'
import { CustomGetRequest, CustomRequest } from '@/src/libs/request'
import {
  formatAmount,
  formatDateTime,
  isFreeQuestionOperation,
  operationTypeLabels,
} from '@/src/app/components/admin/users/format'
import { OperationsHistory } from './operations-history'

interface V2ProfileBalanceProps {
  data: DBUser | null
  setUserBalance: (balance: number) => void
}

const formatRub = (value: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)

const isAlphaStatusFinal = (status: number): boolean =>
  ![AlfaOrderStatusE.Register, AlfaOrderStatusE.New, AlfaOrderStatusE.Hold].includes(status)

// Пополнение баланса / возврат / бонусное начисление — приход.
const isCredit = (op: AdminBalanceOperationI): boolean =>
  op.type === AdminOperationTypeE.FreeAccrual ||
  op.type === AdminOperationTypeE.Refund ||
  (op.type === AdminOperationTypeE.Payment && op.questionId === null)

// Денежное списание (оплата услуги/вопроса), без операций с бесплатными вопросами.
const isMoneySpend = (op: AdminBalanceOperationI): boolean =>
  !isFreeQuestionOperation(op.type) &&
  (op.type === AdminOperationTypeE.Charge ||
    (op.type === AdminOperationTypeE.Payment && op.questionId !== null))

const isSameMonth = (iso: string): boolean => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const monthLabel = capitalize(
  new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
)

export function V2ProfileBalance({ data, setUserBalance }: V2ProfileBalanceProps) {
  const [newOrder, setNewOrder] = useState<DBOrder | null>(null)
  const [minTopupRub, setMinTopupRub] = useState(100)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [operations, setOperations] = useState<AdminBalanceOperationI[]>([])
  const [showAllOperations, setShowAllOperations] = useState(false)
  const [dealsActive, setDealsActive] = useState(0)
  const [dealsCompleted, setDealsCompleted] = useState(0)
  const balance = data?.balance ?? 0
  const topupKop = Math.round(minTopupRub * 100)

  useEffect(() => {
    let active = true
    const fetchMinTopup = async () => {
      const res = await CustomGetRequest('/orders/min-topup/')
      if (active && res.status && typeof res.data?.minTopupRub === 'number') {
        setMinTopupRub(res.data.minTopupRub)
      }
    }
    fetchMinTopup()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (newOrder) return
    let active = true
    const fetchCurrentOrder = async () => {
      const orderData = await CustomGetRequest('/check/')
      if (active && orderData.status) {
        setNewOrder(orderData.data)
      }
    }
    fetchCurrentOrder()
    return () => {
      active = false
    }
  }, [newOrder])

  useEffect(() => {
    if (!newOrder || isAlphaStatusFinal(newOrder.alpha_status)) return
    const intervalId = window.setInterval(async () => {
      const orderData = await CustomRequest('/status/', { slug: newOrder.alpha_id })
      if (!orderData.status || !isAlphaStatusFinal(orderData.data.alpha_status)) return

      window.clearInterval(intervalId)
      if (orderData.data.alpha_status === AlfaOrderStatusE.Auth && orderData.data.ptype === OrderTypeE.Balance) {
        setUserBalance(orderData.data.amount)
      }
      setNewOrder(null)
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [newOrder, setUserBalance])

  // История операций — для превью, расчёта «Потрачено в этом месяце» и времени
  // последнего пополнения. Тянем весь список и считаем на клиенте.
  useEffect(() => {
    let active = true
    const fetchOperations = async () => {
      const res = await CustomGetRequest('/users/me/operations/', { type: 'all' })
      if (active && res.status && Array.isArray(res.data?.items)) {
        setOperations(res.data.items as AdminBalanceOperationI[])
      }
    }
    fetchOperations()
    return () => {
      active = false
    }
  }, [balance])

  // Счётчики дел для карточки «Активных дел / завершено».
  useEffect(() => {
    if (!data?.id) return
    let active = true
    const fetchDeals = async () => {
      const res = await CustomGetRequest('/requests', {
        page: 1,
        limit: 1000,
        sort: JSON.stringify(['id', 'DESC']),
        filter: JSON.stringify({ user_id: data.id }),
      })
      if (!active || !res.status) return
      const rows: DBQuestion[] = res.data ?? []
      const completed = rows.filter((row) => row.job_status === QuestionStatusesE.Approved).length
      const activeCount = rows.filter((row) =>
        [QuestionStatusesE.New, QuestionStatusesE.InProgress, QuestionStatusesE.Unpaid].includes(row.job_status),
      ).length
      setDealsCompleted(completed)
      setDealsActive(activeCount)
    }
    fetchDeals()
    return () => {
      active = false
    }
  }, [data?.id, balance])

  const handleCreateOrder = async () => {
    if (creatingOrder) return
    setCreatingOrder(true)
    const orderData = await CustomRequest('/orders/', { amount: topupKop })
    setCreatingOrder(false)
    if (orderData.status) {
      setNewOrder(orderData.data)
    }
  }

  const recentOperations = useMemo(() => operations.slice(0, 3), [operations])
  const lastTopup = useMemo(() => operations.find(isCredit) ?? null, [operations])
  const monthlySpent = useMemo(
    () =>
      operations
        .filter((op) => isMoneySpend(op) && isSameMonth(op.createdAt))
        .reduce((sum, op) => sum + Math.abs(op.amount), 0),
    [operations],
  )

  const qrUrl = newOrder?.alpha_qr_url ?? null
  const alfaUrl = newOrder?.alpha_form_url ?? null

  const renderOperationValue = (op: AdminBalanceOperationI) => {
    const credit = isCredit(op)
    if (isFreeQuestionOperation(op.type)) {
      const sign = op.type === AdminOperationTypeE.FreeCharge ? '−' : '+'
      return `${sign} ${Math.abs(op.amount)} шт.`
    }
    return `${credit ? '+' : '−'} ${formatAmount(Math.abs(op.amount))} ₽`
  }

  const renderOperationSubtitle = (op: AdminBalanceOperationI) => {
    if (op.questionId) {
      const label = `Вопрос №${op.questionId}`
      return op.questionUuid ? (
        <Link href={`/consultation/${op.questionUuid}/`} className="truncate text-[#34347C] transition-colors hover:opacity-80">
          {label}
        </Link>
      ) : (
        <span className="truncate">{label}</span>
      )
    }
    return <span className="truncate">{op.comment ?? op.actor}</span>
  }

  return (
    <div className="flex w-full flex-col gap-12">
      <div className="flex items-stretch gap-12">
        {/* Доступный баланс */}
        <div className="relative flex flex-1 overflow-hidden rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white p-8 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <div className="relative z-[1] flex flex-1 flex-col justify-between gap-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00BC7D]" />
                <span className="text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.5)]">Доступный баланс</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-end gap-2">
                  <span className="text-[64px] font-bold leading-[70px] text-[#12161B]">{formatRub(balance)}</span>
                  <span className="pb-1.5 text-[32px] font-semibold leading-[35px] tracking-[-0.02em] text-[rgba(18,22,27,0.5)]">₽</span>
                </div>
                <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">
                  {lastTopup
                    ? `Пополнено ${formatDateTime(lastTopup.createdAt)}`
                    : 'Доступно для оплаты вопросов и услуг'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              className="inline-flex h-14 w-fit items-center gap-2 rounded-[35px] border border-white/15 bg-[radial-gradient(circle_at_50%_0%,#34347C_0%,#2D2D6C_100%)] px-7 pl-[22px] text-[18px] font-semibold leading-[21px] text-white shadow-[0px_4px_20px_0px_rgba(47,47,113,0.15)] transition-opacity cursor-pointer hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus className="h-6 w-6" />
              {creatingOrder ? 'Создаём...' : 'Пополнить'}
            </button>
          </div>
          <div className="absolute -left-12 top-[101px] h-64 w-64 rounded-full bg-[rgba(10,2,255,0.06)] blur-[64px]" />
        </div>

        {/* История операций — превью */}
        <div className="flex w-[600px] shrink-0 flex-col gap-6 rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white px-8 py-7 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[20px] font-semibold leading-6 tracking-[-0.01em] text-[#12161B]">История операций</h3>
              <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">{monthLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllOperations((value) => !value)}
              className="inline-flex items-center gap-1 text-[14px] font-medium text-[#34347C] transition-opacity cursor-pointer hover:opacity-80 active:opacity-60"
            >
              {showAllOperations ? 'Свернуть' : 'Все операции'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {recentOperations.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-[rgba(18,22,27,0.5)]">Операций пока нет</p>
            ) : (
              recentOperations.map((op) => {
                const credit = isCredit(op)
                return (
                  <div key={op.id} className="flex items-center gap-4 border-b border-[rgba(18,22,27,0.05)] py-3 last:border-b-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                        credit ? 'bg-[rgba(22,163,74,0.12)] text-[#16A34A]' : 'bg-[rgba(18,22,27,0.04)] text-[rgba(18,22,27,0.6)]'
                      }`}
                    >
                      {credit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-5 text-[#12161B]">{operationTypeLabels[op.type]}</p>
                      <p className="mt-0.5 flex max-w-full truncate text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">
                        {renderOperationSubtitle(op)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[15px] font-semibold leading-5 ${credit ? 'text-[#16A34A]' : 'text-[#12161B]'}`}>
                        {renderOperationValue(op)}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-[17px] text-[rgba(18,22,27,0.35)]">{formatDateTime(op.createdAt)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Стат-карточки: реальные данные */}
      <div className="grid grid-cols-2 gap-12">
        <div className="rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white px-8 py-6 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <p className="text-[12px] font-medium uppercase leading-[17px] tracking-wide text-[rgba(18,22,27,0.4)]">
            Потрачено в этом месяце
          </p>
          <p className="mt-3 text-[32px] font-bold leading-[35px] text-[#12161B]">{formatRub(monthlySpent)} ₽</p>
        </div>
        <div className="rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white px-8 py-6 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <p className="text-[12px] font-medium uppercase leading-[17px] tracking-wide text-[rgba(18,22,27,0.4)]">Активных дел</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-[32px] font-bold leading-[35px] text-[#12161B]">{dealsActive}</span>
            {dealsCompleted > 0 && (
              <span className="mb-1 inline-flex items-center rounded-full bg-[rgba(22,163,74,0.12)] px-2.5 py-1 text-[12px] font-medium text-[#16A34A]">
                {dealsCompleted} завершено
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Блок «Ваши вопросы» (платные/бесплатные) временно скрыт по решению —
          дизайн Баланса приведён к новому макету. Логика реальная сохранена.
      <div className="flex w-[600px] shrink-0 flex-col gap-6 ...">
        ... Платные вопросы: {data?.paid_questions ?? 0} ...
        ... Бесплатные вопросы: {data?.free_questions ?? 0} ...
      </div>
      */}

      {showAllOperations && <OperationsHistory />}

      {newOrder && (
        <div className="rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white p-8 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h3 className="text-[20px] font-semibold leading-6 tracking-[-0.01em] text-[#12161B]">Завершите пополнение</h3>
              <p className="mt-2 text-[14px] leading-5 text-[rgba(18,22,27,0.55)]">Оплатите через Альфа-Банк или отсканируйте QR-код.</p>
              {alfaUrl && (
                <button
                  type="button"
                  onClick={() => { window.location.href = alfaUrl }}
                  className="mt-6 rounded-[18px] bg-[#12161B] px-6 py-3 text-[14px] font-medium text-white transition-opacity cursor-pointer hover:opacity-90 active:opacity-80"
                >
                  Перейти к оплате
                </button>
              )}
            </div>

            {qrUrl && (
              <div className="flex items-center justify-center rounded-[24px] bg-white p-4">
                <QRCodeSVG value={qrUrl} size={180} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
