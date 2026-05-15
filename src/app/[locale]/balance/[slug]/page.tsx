'use client';

import { Button } from "@/src/app/components/ui/button";
import Image from 'next/image'
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CustomRequest } from "@/src/libs/request";
import { CustomResponseDataI } from "@/src/interfaces/api";
import { OrderTypeE, AlfaOrderStatusE } from "@/src/interfaces/payment";

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
  kind: "one_time";
  paid: boolean;
  amount: number | null;
  questionId: string | number | null;
}

interface BalanceViewState {
  kind: "balance";
  /** "success" — пополнение прошло; "unsuccess" — ошибка/отмена. */
  paid: boolean;
}

type ViewState = OneTimeViewState | BalanceViewState;

const formatRub = (n: number): string => new Intl.NumberFormat("ru-RU").format(n);

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
 *   2. По `order.ptype` рендерит либо пополнение баланса (старое UI),
 *      либо подтверждение оплаты вопроса с суммой + автоматический
 *      редирект в `/profile?tab=cases`.
 */
export default function BalancePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = params.slug as string | undefined;
  const isReturnFromAlfa = slug === "success" || slug === "unsuccess";
  const initialPaid = slug === "success";
  // Alfa в этом проекте возвращается как `?orderId=<uuid>` (alpha_id),
  // но на случай несовпадений ловим оба общеупотребимых имени.
  const alfaOrderId = searchParams.get("orderId") ?? searchParams.get("mdOrder") ?? "";

  const [view, setView] = useState<ViewState>({ kind: "balance", paid: initialPaid });
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
        const res: CustomResponseDataI = await CustomRequest("/status", { slug: alfaOrderId });
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
          kind: "one_time",
          paid,
          amount: typeof lastOrder.amount === "number" ? lastOrder.amount : null,
          questionId: lastOrder.question_id ?? null,
        });
        setSecondsLeft(REDIRECT_SECONDS);
      } else {
        setView({ kind: "balance", paid });
      }
      setLoading(false);
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [alfaOrderId, isReturnFromAlfa]);

  const goToProfileTab = (tab: "balance" | "cases") => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname.replace(/\/$/, "") || "";
    const localeMatch = path.match(/^(\/[^/]+)\/balance(\/.*)?$/);
    const base = localeMatch ? `${localeMatch[1]}/profile` : "/profile";
    window.location.assign(`${base}?tab=${tab}`);
  };

  // Авто-редирект в ЛК для OneTime: фоновый таймер. Юзер может ткнуть
  // кнопку и уйти раньше.
  useEffect(() => {
    if (view.kind !== "one_time" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      goToProfileTab("cases");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, view.kind]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
        <p className="text-base text-muted-foreground">Проверяем статус платежа…</p>
      </div>
    );
  }

  if (view.kind === "one_time") {
    return <OneTimeView paid={view.paid} amount={view.amount} secondsLeft={secondsLeft} onContinue={() => goToProfileTab("cases")} onRetry={() => goToProfileTab("cases")} />;
  }

  return <BalanceTopUpView paid={view.paid} onReturn={() => goToProfileTab("balance")} />;
}

/* ------------------------------------------------------------------ */
/* One-time wizard payment (OneTime order)                             */
/* ------------------------------------------------------------------ */

interface OneTimeViewProps {
  paid: boolean;
  amount: number | null;
  secondsLeft: number | null;
  onContinue: () => void;
  onRetry: () => void;
}

function OneTimeView({ paid, amount, secondsLeft, onContinue, onRetry }: OneTimeViewProps) {
  const image = paid ? "/assets/payment-success.png" : "/assets/payment-failed.png";
  const imageAlt = paid ? "Успешная оплата" : "Ошибка при оплате";
  const title = paid ? "Ваш вопрос принят" : "Ваш вопрос сохранён";
  // Two-paragraph copy per spec: same shape as the wizard success/error
  // screens so the user sees a consistent message regardless of whether
  // they paid via balance (in-wizard) or returned from Alfa.
  const amountLine =
    typeof amount === "number" && amount > 0
      ? `С карты успешно списано ${formatRub(amount)} ₽`
      : "Платёж картой прошёл успешно.";
  const paragraphs = paid
    ? [
        amountLine,
        "Ваш вопрос сохранён и отправлен на рассмотрение юристу. Ответ придёт в Личный кабинет и на Вашу электронную почту.",
      ]
    : [
        "Вопрос успешно сохранён в Личном кабинете, но пока не отправлен юристу.",
        "Вы можете оплатить его в Личном кабинете в любое время в разделе «Мои заявки».",
      ];
  const badge = paid
    ? { text: "✔ Оплата подтверждена", type: "success" as const }
    : { text: "✘ Платёж не выполнен", type: "error" as const };
  const footnote = paid && secondsLeft !== null && secondsLeft > 0
    ? `Автоматический переход через ${secondsLeft} с`
    : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[890px]">
        <div className="rounded-3xl bg-surface-elevated p-8 shadow-[0_4px_40px_-12px_oklch(0.5_0.02_260/0.12)] sm:p-12">
          <div className="mx-auto mb-8 flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96">
            <Image src={image} alt={imageAlt} width={384} height={384} className="h-80 w-80 object-contain sm:h-96 sm:w-96" />
          </div>

          <div className="mb-4 flex justify-center">
            <span
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${
                badge.type === "success" ? "bg-[#C9F1E2] text-[#6ED2A2]" : "bg-[#EF44441A] text-[#EF4444]"
              }`}
            >
              {badge.text}
            </span>
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <div className="mt-3 space-y-2 text-center">
            {paragraphs.map((text, i) => (
              <p key={i} className="text-base text-muted-foreground">{text}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button key="go_lk" variant="outline" size="lg"
              className="w-full rounded-xl bg-[#8faaba] text-white hover:bg-[#7a98a7] sm:w-auto"
              onClick={paid ? onContinue : onRetry}
            >
              Перейти к моим вопросам
            </Button>
          </div>

          {footnote && (
            <p className="mt-6 text-center text-xs text-muted-foreground/60 tabular-nums">{footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Legacy: top-up balance flow                                         */
/* ------------------------------------------------------------------ */

interface BalanceTopUpViewProps {
  paid: boolean;
  onReturn: () => void;
}

function BalanceTopUpView({ paid, onReturn }: BalanceTopUpViewProps) {
  const image = paid ? "/assets/payment-success.png" : "/assets/payment-failed.png";
  const imageAlt = paid ? "Успешная оплата" : "Ошибка при оплате";
  const badge = paid
    ? { text: "✔ Баланс пополнен", type: "success" as const }
    : { text: "✘ Платёж не выполнен", type: "error" as const };
  const title = paid ? "Баланс успешно пополнен" : "Не удалось выполнить платёж";
  const subtitle = paid
    ? "Деньги будут зачислены на ваш счёт в течении нескольких минут. После этого вы сможете оплатить консультацию юриста или задать вопрос."
    : "Что-то пошло не так. Деньги не списаны или платёж не завершён. Попробуйте ещё раз или выберите другой способ оплаты.";
  const footnote = paid ? "Если платёж отображается с задержкой — обновите страницу или проверьте баланс позже." : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[890px]">
        <div className="rounded-3xl bg-surface-elevated p-8 shadow-[0_4px_40px_-12px_oklch(0.5_0.02_260/0.12)] sm:p-12">
          <div className="mx-auto mb-8 flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96">
            <Image src={image} alt={imageAlt} width={384} height={384} className="h-80 w-80 object-contain sm:h-96 sm:w-96" />
          </div>

          <div className="mb-4 flex justify-center">
            <span
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${
                badge.type === "success" ? "bg-[#C9F1E2] text-[#6ED2A2]" : "bg-[#EF44441A] text-[#EF4444]"
              }`}
            >
              {badge.text}
            </span>
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 text-center text-base text-muted-foreground">{subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button key="back_to_balance_btn" variant="outline" size="lg"
              className="w-full rounded-xl border border-[#e0e0e0] text-[#f44336] hover:bg-[#f5f5f5] transition-colors sm:w-auto"
              onClick={onReturn}
            >
              Вернуться к странице Баланса
            </Button>
          </div>

          {footnote && (
            <p className="mt-6 text-center text-xs text-muted-foreground/60">{footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
