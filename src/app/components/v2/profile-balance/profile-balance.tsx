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
import styles from './profile-balance.module.css'

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
  const freeQuestions = data?.free_questions ?? 0
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
      return (
        <Link
          href={`/profile/?tab=cases&question=${op.questionId}`}
          className={styles.subtitleLink}
        >
          {label}
        </Link>
      )
    }
    return <span className={styles.subtitleText}>{op.comment ?? op.actor}</span>
  }

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <div className={styles.balanceCol}>
          {/* Доступный баланс */}
          <div className={styles.balanceCard}>
            <div className={styles.balanceInner}>
              <div className={styles.balanceTop}>
                <div className={styles.balanceStatus}>
                  <span className={styles.statusDot} />
                  <span className={styles.statusLabel}>Доступный баланс</span>
                </div>
                <div className={styles.balanceAmountWrap}>
                  <div className={styles.balanceAmountRow}>
                    <span className={styles.balanceAmount}>{formatRub(balance)}</span>
                    <span className={styles.balanceCurrency}>₽</span>
                  </div>
                  <span className={styles.balanceHint}>
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
                className={styles.topupBtn}
              >
                <Plus className={styles.topupIcon} />
                {creatingOrder ? 'Создаём...' : 'Пополнить'}
              </button>
            </div>
            <div className={styles.balanceBlur} />
          </div>

          {/* Бесплатные вопросы (подписка / начисления админом) */}
          <div className={styles.freeQuestionsCard}>
            <div className={styles.balanceStatus}>
              <span className={`${styles.statusDot} ${styles.statusDotPurple}`} />
              <span className={styles.statusLabel}>Бесплатные вопросы</span>
            </div>
            <div className={styles.balanceAmountWrap}>
              <div className={styles.balanceAmountRow}>
                <span className={styles.freeQuestionsAmount}>{freeQuestions}</span>
                <span className={styles.balanceCurrency}>шт.</span>
              </div>
              <span className={styles.balanceHint}>
                {freeQuestions > 0
                  ? 'Списываются в первую очередь при отправке вопроса'
                  : 'Появятся при активной подписке или начислении'}
              </span>
            </div>
          </div>
        </div>

        {/* История операций — превью */}
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <div className={styles.historyTitleWrap}>
              <h3 className={styles.historyTitle}>История операций</h3>
              <span className={styles.historyMonth}>{monthLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllOperations((value) => !value)}
              className={styles.historyToggle}
            >
              {showAllOperations ? 'Свернуть' : 'Все операции'}
              <ArrowRight className={styles.toggleIcon} />
            </button>
          </div>

          <div className={styles.historyList}>
            {recentOperations.length === 0 ? (
              <p className={styles.historyEmpty}>Операций пока нет</p>
            ) : (
              recentOperations.map((op) => {
                const credit = isCredit(op)
                return (
                  <div key={op.id} className={styles.opRow}>
                    <div
                      className={`${styles.opIcon} ${credit ? styles.opIconCredit : styles.opIconDebit}`}
                    >
                      {credit ? <ArrowDownLeft className={styles.opIconSvg} /> : <ArrowUpRight className={styles.opIconSvg} />}
                    </div>
                    <div className={styles.opBody}>
                      <p className={styles.opTitle}>{operationTypeLabels[op.type]}</p>
                      <p className={styles.opSubtitle}>
                        {renderOperationSubtitle(op)}
                      </p>
                    </div>
                    <div className={styles.opRight}>
                      <p className={`${styles.opValue} ${credit ? styles.opValueCredit : ''}`}>
                        {renderOperationValue(op)}
                      </p>
                      <p className={styles.opDate}>{formatDateTime(op.createdAt)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Стат-карточки: реальные данные */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Потрачено в этом месяце</p>
          <p className={styles.statValue}>{formatRub(monthlySpent)} ₽</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Активных дел</p>
          <div className={styles.statRow}>
            <span className={styles.statNumber}>{dealsActive}</span>
            {dealsCompleted > 0 && (
              <span className={styles.statBadge}>{dealsCompleted} завершено</span>
            )}
          </div>
        </div>
      </div>

      {showAllOperations && <OperationsHistory />}

      {newOrder && (
        <div className={styles.orderCard}>
          <div className={styles.orderRow}>
            <div>
              <h3 className={styles.orderTitle}>Завершите пополнение</h3>
              <p className={styles.orderSubtitle}>Оплатите через Альфа-Банк или отсканируйте QR-код.</p>
              {alfaUrl && (
                <button
                  type="button"
                  onClick={() => { window.location.href = alfaUrl }}
                  className={styles.orderPayBtn}
                >
                  Перейти к оплате
                </button>
              )}
            </div>

            {qrUrl && (
              <div className={styles.qrWrap}>
                <QRCodeSVG value={qrUrl} size={180} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
