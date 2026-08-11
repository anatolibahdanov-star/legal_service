'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CreditCard, Plus, QrCode } from 'lucide-react'
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
  formatDate,
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

type TopupMethodT = 'form' | 'qr'

type MySubscriptionT = {
  planName: string | null
  tone: string | null
  priceRub: number
  bvAmount: number
  questionsRemaining: number
  questionsTotal: number
  periodStart: string | null
  periodEnd: string | null
  willRenew: boolean
}

const questionsWord = (n: number) => {
  const tail = Math.abs(n) % 100
  const last = tail % 10
  if (tail > 10 && tail < 15) return 'вопросов'
  if (last === 1) return 'вопрос'
  if (last >= 2 && last <= 4) return 'вопроса'
  return 'вопросов'
}

const SUB_TONE_COLORS: Record<string, string> = {
  orange: '#c44021',
  yellow: '#b8a91a',
  purple: '#34347c',
  green: '#183e35',
}

const SUB_TONE_BG: Record<string, string> = {
  orange: '#f5b29a',
  yellow: '#ebe46a',
  purple: '#a8a6e0',
  green: '#7eb8a6',
}

// Платёжная сессия и QR у Альфы живут ~20 минут — более старый незавершённый
// заказ не переиспользуем, вместо него создаём новый.
const REUSABLE_ORDER_TTL_MS = 15 * 60 * 1000

const formatRub = (value: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)

const isAlphaStatusFinal = (status: number): boolean =>
  ![AlfaOrderStatusE.Register, AlfaOrderStatusE.New, AlfaOrderStatusE.Hold].includes(status)

// Пополнение баланса / возврат / бонусное начисление — приход.
const isCredit = (op: AdminBalanceOperationI): boolean =>
  op.type === AdminOperationTypeE.FreeAccrual ||
  op.type === AdminOperationTypeE.OneTimeAccrual ||
  op.type === AdminOperationTypeE.Refund ||
  (op.type === AdminOperationTypeE.Payment && op.questionId === null)

// Денежное списание (оплата услуги/вопроса/подписки), без операций с бесплатными вопросами.
const isMoneySpend = (op: AdminBalanceOperationI): boolean =>
  !isFreeQuestionOperation(op.type) &&
  (op.type === AdminOperationTypeE.Charge ||
    op.type === AdminOperationTypeE.SubscriptionPayment ||
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
  const [oneTimeTopupRub, setOneTimeTopupRub] = useState<number | null>(null)
  const [methodPickerOpen, setMethodPickerOpen] = useState(false)
  const [creatingMethod, setCreatingMethod] = useState<TopupMethodT | null>(null)
  const [topupError, setTopupError] = useState('')
  const [operations, setOperations] = useState<AdminBalanceOperationI[]>([])
  const [showAllOperations, setShowAllOperations] = useState(false)
  const [dealsActive, setDealsActive] = useState(0)
  const [dealsCompleted, setDealsCompleted] = useState(0)
  const [mySub, setMySub] = useState<MySubscriptionT | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [opsRefreshKey, setOpsRefreshKey] = useState(0)
  const [subLoaded, setSubLoaded] = useState(false)
  const operationsHistoryRef = useRef<HTMLDivElement>(null)
  const balance = data?.balance ?? 0
  const topupKop = Math.round(minTopupRub * 100)

  useEffect(() => {
    let active = true
    const fetchMinTopup = async () => {
      const res = await CustomGetRequest('/orders/min-topup/')
      if (active && res.status && typeof res.data?.minTopupRub === 'number') {
        setMinTopupRub(res.data.minTopupRub)
      }
      if (active && res.status && typeof res.data?.oneTimeTopupRub === 'number' && res.data.oneTimeTopupRub > 0) {
        setOneTimeTopupRub(res.data.oneTimeTopupRub)
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
  }, [balance, opsRefreshKey])

  useEffect(() => {
    if (!showAllOperations) return
    const timer = window.setTimeout(() => {
      operationsHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [showAllOperations])

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

  useEffect(() => {
    if (!data?.id) return
    let active = true
    const fetchSubscription = async () => {
      const res = await CustomGetRequest('/subscriptions/me')
      if (!active) return
      if (res.status) {
        setMySub((res.data?.subscription as MySubscriptionT | null) ?? null)
      }
      setSubLoaded(true)
    }
    fetchSubscription()
    return () => {
      active = false
    }
  }, [data?.id, data?.free_questions, balance])

  const handleCancelSubscription = async () => {
    if (cancelling) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await CustomRequest('/subscriptions/cancel', {})
      if (res.status) {
        setMySub((prev) => (prev ? { ...prev, willRenew: false } : prev))
        setCancelConfirmOpen(false)
        setOpsRefreshKey((key) => key + 1)
      } else {
        setCancelError(res.error || 'Не удалось отключить автопродление. Попробуйте ещё раз.')
      }
    } catch {
      setCancelError('Техническая ошибка. Попробуйте ещё раз.')
    } finally {
      setCancelling(false)
    }
  }

  const cancelRequestedRef = useRef(false)
  const orderCardRef = useRef<HTMLDivElement | null>(null)
  const [pickerOpenedAt, setPickerOpenedAt] = useState(0)

  const openMethodPicker = () => {
    setTopupError('')
    setPickerOpenedAt(Date.now())
    setMethodPickerOpen(true)
  }

  const closeMethodPicker = () => {
    if (creatingMethod) cancelRequestedRef.current = true
    setTopupError('')
    setMethodPickerOpen(false)
  }

  // Незавершённый заказ переиспользуем, только если он свежий и банк отдал
  // и форму, и QR — полусозданный или протухший заказ игнорируем и создаём новый.
  const getReusableOrder = (now: number): DBOrder | null =>
    now > 0 &&
    newOrder &&
    !isAlphaStatusFinal(newOrder.alpha_status) &&
    newOrder.alpha_form_url &&
    newOrder.alpha_qr_url &&
    now - new Date(newOrder.created_at as unknown as string).getTime() < REUSABLE_ORDER_TTL_MS
      ? newOrder
      : null

  const reusableOrder = getReusableOrder(pickerOpenedAt)
  const topupAmountRub = reusableOrder ? reusableOrder.amount / 100 : minTopupRub

  // Заказ в Альфе создаётся только здесь — после явного выбора способа оплаты.
  const handleSelectMethod = async (method: TopupMethodT) => {
    if (creatingMethod) return
    setTopupError('')

    let order = getReusableOrder(Date.now())
    if (!order) {
      cancelRequestedRef.current = false
      setCreatingMethod(method)
      const orderData = await CustomRequest('/orders/', { amount: topupKop })
      setCreatingMethod(null)
      if (!orderData.status) {
        if (!cancelRequestedRef.current) {
          setTopupError(orderData.error || 'Не удалось создать платёж. Попробуйте ещё раз.')
        }
        return
      }
      order = orderData.data as DBOrder
      setNewOrder(order)
      if (cancelRequestedRef.current) return
    }

    if (method === 'qr' && !order.alpha_qr_url) {
      setTopupError('Банк не вернул QR-код. Попробуйте оплату через форму.')
      return
    }
    if (method === 'form' && !order.alpha_form_url) {
      setTopupError('Платёжная форма недоступна. Попробуйте оплату по QR-коду.')
      return
    }

    // Состояние сбрасываем до редиректа: при возврате «Назад» браузер может
    // восстановить страницу из bfcache с живым состоянием React.
    setMethodPickerOpen(false)
    if (method === 'form') {
      window.location.href = order.alpha_form_url
      return
    }
    requestAnimationFrame(() => {
      orderCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const recentOperations = useMemo(() => operations.slice(0, 4), [operations])
  const lastTopup = useMemo(() => operations.find(isCredit) ?? null, [operations])
  const monthlySpent = useMemo(
    () =>
      operations
        .filter((op) => isMoneySpend(op) && isSameMonth(op.createdAt))
        .reduce((sum, op) => sum + Math.abs(op.amount), 0),
    [operations],
  )

  const freeQuestions = data?.free_questions ?? 0
  const subscriptionQuestions = mySub?.questionsRemaining ?? 0
  const adminQuestions = Math.max(0, freeQuestions - subscriptionQuestions)
  const oneTimeQuestions = oneTimeTopupRub ? Math.floor(balance / oneTimeTopupRub) : 0
  const availableQuestions = freeQuestions + oneTimeQuestions

  const qrUrl = newOrder?.alpha_qr_url ?? null
  const alfaUrl = newOrder?.alpha_form_url ?? null

  const renderOperationValue = (op: AdminBalanceOperationI) => {
    const credit = isCredit(op)
    if (op.type === AdminOperationTypeE.SubscriptionCancel) return '—'
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
        <>
          <Link
            href={`/profile/?tab=cases&question=${op.questionId}`}
            className={styles.subtitleLink}
          >
            {label}
          </Link>
          {op.comment ? <span className={styles.subtitleText}>{` · ${op.comment}`}</span> : null}
        </>
      )
    }
    return <span className={styles.subtitleText}>{op.comment ?? op.actor}</span>
  }

  return (
    <div className={styles.root}>
      {/* Верх: баланс + превью истории — одна высота */}
      <div className={styles.topRow}>
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
            {!methodPickerOpen ? (
              <button
                type="button"
                onClick={openMethodPicker}
                className={styles.topupBtn}
              >
                <Plus className={styles.topupIcon} />
                Пополнить
              </button>
            ) : (
              <div className={styles.methodPicker}>
                <div>
                  <p className={styles.methodTitle}>Выберите способ оплаты</p>
                  <p className={styles.methodHint}>
                    Пополнение на {formatRub(topupAmountRub)} ₽ через Альфа-Банк
                  </p>
                </div>
                <div className={styles.methodButtons}>
                  <button
                    type="button"
                    onClick={() => handleSelectMethod('form')}
                    disabled={creatingMethod !== null}
                    className={styles.methodBtn}
                  >
                    <CreditCard className={styles.methodIcon} />
                    {creatingMethod === 'form' ? 'Создаём платёж…' : 'Через форму оплаты'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMethod('qr')}
                    disabled={creatingMethod !== null}
                    className={styles.methodBtn}
                  >
                    <QrCode className={styles.methodIcon} />
                    {creatingMethod === 'qr' ? 'Создаём платёж…' : 'По QR-коду'}
                  </button>
                </div>
                {topupError && <p className={styles.methodError}>{topupError}</p>}
                <button
                  type="button"
                  onClick={closeMethodPicker}
                  className={styles.methodCancel}
                >
                  Отменить
                </button>
              </div>
            )}
          </div>

          <div className={styles.subscriptionPanel}>
            <div className={styles.balanceStatus}>
              <span
                className={styles.statusDot}
                style={{
                  background: mySub
                    ? (SUB_TONE_COLORS[mySub.tone ?? ''] ?? '#34347c')
                    : 'rgba(18, 22, 27, 0.25)',
                }}
              />
              <span className={styles.statusLabel}>
                {subLoaded ? (mySub ? 'Активная подписка' : 'Подписка') : 'Подписка'}
              </span>
            </div>

            {!subLoaded ? (
              <p className={styles.balanceHint}>Загружаем…</p>
            ) : mySub ? (
              <>
                <div className={styles.subCardHeader}>
                  <span
                    className={styles.subPlanBadge}
                    style={{ background: SUB_TONE_BG[mySub.tone ?? ''] ?? '#a8a6e0' }}
                  >
                    {mySub.planName ?? 'Тариф'}
                  </span>
                  <span className={styles.subPrice}>{formatRub(mySub.priceRub)} ₽/мес</span>
                </div>

                <div className={styles.subQuestionsRow}>
                  <span className={styles.subQuestionsCount}>
                    {mySub.questionsRemaining}
                    <span className={styles.subQuestionsTotal}>/{mySub.questionsTotal}</span>
                  </span>
                  <span className={styles.subQuestionsLabel}>
                    {questionsWord(mySub.questionsRemaining)} осталось в этом периоде
                  </span>
                </div>

                <dl className={styles.subMetaList}>
                  <div className={styles.subMetaRow}>
                    <dt>Оформлена</dt>
                    <dd>{mySub.periodStart ? formatDate(mySub.periodStart) : '—'}</dd>
                  </div>
                  <div className={styles.subMetaRow}>
                    <dt>Действует до</dt>
                    <dd>{mySub.periodEnd ? formatDate(mySub.periodEnd) : '—'}</dd>
                  </div>
                  <div className={styles.subMetaRow}>
                    <dt>Автопродление</dt>
                    <dd>{mySub.willRenew ? 'Включено' : 'Отключено'}</dd>
                  </div>
                  <div className={styles.subMetaRow}>
                    <dt>Лимит периода</dt>
                    <dd>
                      {mySub.bvAmount} {questionsWord(mySub.bvAmount)} / мес
                    </dd>
                  </div>
                </dl>

                {mySub.willRenew && !cancelConfirmOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError('')
                      setCancelConfirmOpen(true)
                    }}
                    className={styles.subCancelLink}
                  >
                    Отключить автопродление
                  </button>
                )}
                {cancelConfirmOpen && (
                  <div className={styles.subConfirm}>
                    <p className={styles.subConfirmText}>
                      Автосписания прекратятся. Подписка и оставшиеся вопросы будут
                      действовать до{' '}
                      {mySub.periodEnd ? formatDate(mySub.periodEnd) : 'конца оплаченного периода'}.
                      Возобновить можно повторной покупкой тарифа.
                    </p>
                    {cancelError && <p className={styles.methodError}>{cancelError}</p>}
                    <div className={styles.subConfirmBtns}>
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        className={styles.subConfirmBtn}
                      >
                        {cancelling ? 'Отключаем…' : 'Да, отписаться'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelConfirmOpen(false)}
                        disabled={cancelling}
                        className={styles.methodCancel}
                      >
                        Оставить
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.subEmpty}>
                <p className={styles.subEmptyTitle}>Нет активной подписки</p>
                <p className={styles.balanceHint}>
                  Подключите тариф, чтобы получать пакет вопросов каждый месяц
                </p>
                <Link href="/#subscriptions" className={styles.subEmptyCta}>
                  Смотреть тарифы
                  <ArrowRight className={styles.toggleIcon} />
                </Link>
              </div>
            )}
          </div>

          <div className={styles.balanceBlur} />
        </div>

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
              aria-expanded={showAllOperations}
              aria-controls="operations-history"
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

      {/* Низ: траты · дела */}
      <div className={styles.secondaryGrid}>
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Потрачено в этом месяце</p>
            <p className={styles.statValue}>{formatRub(monthlySpent)} ₽</p>
          </div>
          <div className={styles.statDivider} />
          <div>
            <p className={styles.statLabel}>Доступно вопросов</p>
            <div className={styles.statRow}>
              <span className={styles.statNumber}>{availableQuestions}</span>
              <span className={styles.statBadge}>
                подписка {subscriptionQuestions} · начислено {adminQuestions} · разовые {oneTimeQuestions}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Активных дел</p>
            <p className={styles.statValue}>{dealsActive}</p>
          </div>
          <div className={styles.statDivider} />
          <div>
            <p className={styles.statLabel}>Завершено</p>
            <p className={styles.statValue}>{dealsCompleted}</p>
          </div>
        </div>
      </div>

      {showAllOperations && (
        <div ref={operationsHistoryRef} className={styles.operationsHistoryAnchor} id="operations-history">
          <OperationsHistory key={opsRefreshKey} />
        </div>
      )}

      {newOrder && (
        <div className={styles.orderCard} ref={orderCardRef}>
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
