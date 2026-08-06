'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  PaymentResult,
  PaymentResultLoading,
  type PaymentResultKind,
} from '@/src/app/components/v2/payment-result/payment-result'
import { CustomRequest } from '@/src/libs/request'
import type { CustomResponseDataI } from '@/src/interfaces/api'
import { OrderTypeE, AlfaOrderStatusE } from '@/src/interfaces/payment'

const REDIRECT_SECONDS = 5

// СБП у Альфы доходит до финального статуса асинхронно (обычно секунды,
// но бывает до ~20с). Пока ответ Register/Hold/New — переспрашиваем бэк,
// чтобы не показать юзеру ложный «✘ Платёж не выполнен».
const PENDING_ALFA_STATUSES: AlfaOrderStatusE[] = [
  AlfaOrderStatusE.Register,
  AlfaOrderStatusE.Hold,
  AlfaOrderStatusE.New,
]
const MAX_STATUS_ATTEMPTS = 10
const STATUS_RETRY_DELAY_MS = 2000

interface ViewState {
  kind: PaymentResultKind
  paid: boolean
  /** Рубли для отображения; для Balance-заказов конвертируем из копеек. */
  amount: number | null
}

/**
 * Универсальная страница возврата с Alfa.
 *
 * Alfa отправляет пользователя на `${returnUrl}?orderId=<uuid>` после
 * успеха и на `${failUrl}?orderId=<uuid>` после ошибки/отмены. Тип
 * заказа (Balance / OneTime / Subscription) мы знаем только после того,
 * как сервер сходит в Alfa и обновит наш `porder`.
 */
export default function BalancePage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const slug = params.slug as string | undefined
  const isReturnFromAlfa = slug === 'success' || slug === 'unsuccess'
  const initialPaid = slug === 'success'
  const alfaOrderId = searchParams.get('orderId') ?? searchParams.get('mdOrder') ?? ''

  const [view, setView] = useState<ViewState>({
    kind: 'balance',
    paid: initialPaid,
    amount: null,
  })
  const [loading, setLoading] = useState<boolean>(isReturnFromAlfa && !!alfaOrderId)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!isReturnFromAlfa || !alfaOrderId) return
    let cancelled = false
    type StatusOrder = {
      ptype?: OrderTypeE
      alpha_status?: AlfaOrderStatusE
      amount?: number
      question_id?: number | string | null
    }
    const verify = async () => {
      let lastOrder: StatusOrder | null = null
      for (let attempt = 0; attempt < MAX_STATUS_ATTEMPTS; attempt++) {
        const res: CustomResponseDataI = await CustomRequest('/status', { slug: alfaOrderId })
        if (cancelled) return
        if (!res.status || !res.data) {
          setLoading(false)
          return
        }
        lastOrder = res.data as StatusOrder
        const isPending =
          lastOrder.alpha_status !== undefined &&
          PENDING_ALFA_STATUSES.includes(lastOrder.alpha_status)
        if (!isPending) break
        await new Promise((r) => setTimeout(r, STATUS_RETRY_DELAY_MS))
        if (cancelled) return
      }
      if (!lastOrder) {
        setLoading(false)
        return
      }
      const paid = lastOrder.alpha_status === AlfaOrderStatusE.Auth
      const rawAmount = typeof lastOrder.amount === 'number' ? lastOrder.amount : null

      if (lastOrder.ptype === OrderTypeE.OneTime) {
        setView({ kind: 'one_time', paid, amount: rawAmount })
        // Auto-redirect only for OneTime / Subscription. Balance stays on
        // the page so the user can read the delayed-credit note.
        if (paid) setSecondsLeft(REDIRECT_SECONDS)
      } else if (lastOrder.ptype === OrderTypeE.Subscription) {
        setView({ kind: 'subscription', paid, amount: rawAmount })
        if (paid) setSecondsLeft(REDIRECT_SECONDS)
      } else {
        // Balance orders are stored in kopecks.
        const rub = rawAmount !== null ? Math.round(rawAmount / 100) : null
        setView({ kind: 'balance', paid, amount: rub && rub > 0 ? rub : null })
      }
      setLoading(false)
    }
    void verify()
    return () => {
      cancelled = true
    }
  }, [alfaOrderId, isReturnFromAlfa])

  const goToProfileTab = (tab: 'balance' | 'cases') => {
    if (typeof window === 'undefined') return
    const path = window.location.pathname.replace(/\/$/, '') || ''
    const localeMatch = path.match(/^(\/[^/]+)\/balance(\/.*)?$/)
    const base = localeMatch ? `${localeMatch[1]}/profile` : '/profile'
    window.location.assign(`${base}?tab=${tab}`)
  }

  const primaryTab: 'balance' | 'cases' = view.kind === 'one_time' ? 'cases' : 'balance'

  useEffect(() => {
    if (secondsLeft === null) return
    if (!view.paid) return
    if (view.kind !== 'one_time' && view.kind !== 'subscription') return
    if (secondsLeft <= 0) {
      goToProfileTab(primaryTab)
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, view.paid, view.kind, primaryTab])

  if (loading) {
    return <PaymentResultLoading />
  }

  return (
    <PaymentResult
      kind={view.kind}
      paid={view.paid}
      amount={view.amount}
      secondsLeft={secondsLeft}
      onPrimary={() => goToProfileTab(primaryTab)}
    />
  )
}
