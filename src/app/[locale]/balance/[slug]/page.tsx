'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  PaymentResult,
  PaymentResultLoading,
  type PaymentResultKind,
} from '@/src/app/components/v2/payment-result/payment-result';
import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';
import { OrderTypeE, AlfaOrderStatusE } from '@/src/interfaces/payment';

const REDIRECT_SECONDS = 5;

// СБП у Альфы доходит до финального статуса асинхронно (обычно секунды,
// но бывает до ~20с). Пока ответ Register/Hold/New — переспрашиваем бэк,
// чтобы не показать юзеру ложный «✘ Платёж не выполнен».
const PENDING_ALFA_STATUSES: AlfaOrderStatusE[] = [
  AlfaOrderStatusE.Register,
  AlfaOrderStatusE.Hold,
  AlfaOrderStatusE.New,
];
const MAX_STATUS_ATTEMPTS = 10;
const STATUS_RETRY_DELAY_MS = 2000;

interface OneTimeViewState {
  kind: 'one_time';
  paid: boolean;
  amount: number | null;
  questionId: string | number | null;
}

interface BalanceViewState {
  kind: 'balance';
  /** "success" — пополнение прошло; "unsuccess" — ошибка/отмена. */
  paid: boolean;
}

interface SubscriptionViewState {
  kind: 'subscription';
  paid: boolean;
  amount: number | null;
}

type ViewState = OneTimeViewState | BalanceViewState | SubscriptionViewState;

/**
 * Универсальная страница возврата с Alfa.
 *
 * Alfa отправляет пользователя на `${returnUrl}?orderId=<uuid>` после
 * успеха и на `${failUrl}?orderId=<uuid>` после ошибки/отмены. Тип
 * заказа (Balance vs OneTime — оплата одного wizard-вопроса) мы знаем
 * только после того, как сервер сходит в Alfa и обновит наш `porder`.
 *
 * Поэтому страница:
 *   1. По `?orderId=` дёргает POST `/api/status` — он триггерит
 *      `checkOrderStatus` на бэке (тот пишет Alfa-статус в БД и для
 *      OneTime ордеров переводит вопрос Unpaid → InProgress).
 *   2. По `order.ptype` рендерит экран результата (v2 PaymentResult) +
 *      для OneTime/Subscription — авто-редирект в ЛК.
 */
export default function BalancePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = params.slug as string | undefined;
  const isReturnFromAlfa = slug === 'success' || slug === 'unsuccess';
  const initialPaid = slug === 'success';
  // Alfa в этом проекте возвращается как `?orderId=<uuid>` (alpha_id),
  // но на случай несовпадений ловим оба общеупотребимых имени.
  const alfaOrderId = searchParams.get('orderId') ?? searchParams.get('mdOrder') ?? '';

  const [view, setView] = useState<ViewState>({ kind: 'balance', paid: initialPaid });
  // Loading only matters when we'll actually fetch — keep it scoped so we
  // don't have to setLoading(false) from inside the effect body
  // (eslint react-hooks/set-state-in-effect).
  const [loading, setLoading] = useState<boolean>(isReturnFromAlfa && !!alfaOrderId);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isReturnFromAlfa || !alfaOrderId) {
      return;
    }
    let cancelled = false;
    type StatusOrder = {
      ptype?: OrderTypeE;
      alpha_status?: AlfaOrderStatusE;
      amount?: number;
      question_id?: number | string | null;
    };
    const verify = async () => {
      let lastOrder: StatusOrder | null = null;
      for (let attempt = 0; attempt < MAX_STATUS_ATTEMPTS; attempt++) {
        const res: CustomResponseDataI = await CustomRequest('/status', { slug: alfaOrderId });
        if (cancelled) return;
        if (!res.status || !res.data) {
          // Без подтверждения сервера для wizard-флоу мы не знаем тип ордера.
          // Падаем на дефолтное «Баланс пополнен/Ошибка» — это безопасно для
          // legacy-пути пополнения баланса.
          setLoading(false);
          return;
        }
        lastOrder = res.data as StatusOrder;
        const isPending =
          lastOrder.alpha_status !== undefined &&
          PENDING_ALFA_STATUSES.includes(lastOrder.alpha_status);
        if (!isPending) break;
        await new Promise((r) => setTimeout(r, STATUS_RETRY_DELAY_MS));
        if (cancelled) return;
      }
      if (!lastOrder) {
        setLoading(false);
        return;
      }
      const paid = lastOrder.alpha_status === AlfaOrderStatusE.Auth;
      if (lastOrder.ptype === OrderTypeE.OneTime) {
        setView({
          kind: 'one_time',
          paid,
          amount: typeof lastOrder.amount === 'number' ? lastOrder.amount : null,
          questionId: lastOrder.question_id ?? null,
        });
        // Auto-redirect only on successful payment. On failure the user
        // must stay on the page to see the "Платёж не прошёл" message
        // and decide whether to retry.
        if (paid) setSecondsLeft(REDIRECT_SECONDS);
      } else if (lastOrder.ptype === OrderTypeE.Subscription) {
        setView({
          kind: 'subscription',
          paid,
          amount: typeof lastOrder.amount === 'number' ? lastOrder.amount : null,
        });
        if (paid) setSecondsLeft(REDIRECT_SECONDS);
      } else {
        setView({ kind: 'balance', paid });
      }
      setLoading(false);
    };
    void verify();
    return () => {
      cancelled = true;
    };
  }, [alfaOrderId, isReturnFromAlfa]);

  const goToProfileTab = (tab: 'balance' | 'cases') => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.replace(/\/$/, '') || '';
    const localeMatch = path.match(/^(\/[^/]+)\/balance(\/.*)?$/);
    const base = localeMatch ? `${localeMatch[1]}/profile` : '/profile';
    window.location.assign(`${base}?tab=${tab}`);
  };

  // Авто-редирект в ЛК для OneTime/Subscription: фоновый таймер. Юзер может
  // ткнуть кнопку и уйти раньше.
  useEffect(() => {
    if (secondsLeft === null) return;
    if (view.kind !== 'one_time' && view.kind !== 'subscription') return;
    if (secondsLeft <= 0) {
      goToProfileTab(view.kind === 'subscription' ? 'balance' : 'cases');
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, view.kind]);

  if (loading) {
    return <PaymentResultLoading />;
  }

  const kind: PaymentResultKind = view.kind;
  const amount = view.kind === 'balance' ? null : view.amount;
  const primaryTab: 'balance' | 'cases' = view.kind === 'one_time' ? 'cases' : 'balance';

  return (
    <PaymentResult
      kind={kind}
      paid={view.paid}
      amount={amount}
      secondsLeft={secondsLeft}
      onPrimary={() => goToProfileTab(primaryTab)}
    />
  );
}
