"use client";

import { useState } from "react";
import { AlertCircle, Check, CreditCard, Loader2, Wallet } from "lucide-react";
import { cn } from "@/src/app/components/ui/utils";

const BRAND = "#8faaba";

type PayMethod = "balance" | "card";

interface RequestStepPaymentProps {
  /** Price in rubles, from the backend (env-driven). */
  price: number;
  /** Current user balance in rubles. */
  balance: number;
  variant?: "legacy" | "v2";
  /** Handles the card-payment flow (create Alfa order → redirect to formUrl). */
  onPayCard: () => Promise<{ ok: boolean; message?: string }>;
  /** Handles the balance-payment flow (stub for task 7 for now). */
  onPayBalance: () => Promise<{ ok: boolean; message?: string }>;
  /**
   * Creates an unpaid question and redirects to the profile. Опциональный —
   * в LK-сценарии «Оплатить» из списка заявок этой кнопки не должно быть
   * (вопрос уже сохранён и виден в таблице).
   */
  onPayLater?: () => Promise<{ ok: boolean; message?: string }>;
  /** Redirects to the balance top-up screen. */
  onTopUp: () => void;
}

const formatRub = (n: number): string =>
  new Intl.NumberFormat("ru-RU").format(n);

export default function RequestStepPayment({
  price,
  balance,
  variant = "legacy",
  onPayCard,
  onPayBalance,
  onPayLater,
  onTopUp,
}: RequestStepPaymentProps) {
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [submitting, setSubmitting] = useState<"pay" | "later" | null>(null);
  const [error, setError] = useState<string>("");

  const enoughBalance = balance >= price;
  const isV2 = variant === "v2";
  // Card is always payable; balance only if there's enough.
  const canPay = method === "card" || (method === "balance" && enoughBalance);

  const primaryLabel = !method
    ? "Выберите способ оплаты"
    : method === "balance"
      ? `Оплатить с баланса · ${formatRub(price)} ₽`
      : `Оплатить картой · ${formatRub(price)} ₽`;

  const handlePay = async () => {
    if (!canPay || submitting) return;
    setError("");
    setSubmitting("pay");
    const res = method === "card" ? await onPayCard() : await onPayBalance();
    if (!res.ok) {
      setError(res.message ?? "Не удалось провести оплату.");
      setSubmitting(null);
    }
    // On success the parent handles redirect/navigation, so we leave the
    // submitting flag on to keep the button disabled until the page changes.
  };

  const handleLater = async () => {
    if (submitting || !onPayLater) return;
    setError("");
    setSubmitting("later");
    const res = await onPayLater();
    if (!res.ok) {
      setError(res.message ?? "Не удалось сохранить вопрос.");
      setSubmitting(null);
    }
  };

  return (
    <div
      className={cn(
        isV2
          ? "flex flex-col gap-6"
          : "bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl"
      )}
    >
      {/* Price block */}
      <section
        className={cn(
          isV2
            ? "rounded-[24px] bg-[#F7F6F9] border border-[rgba(18,22,27,0.06)] px-6 py-5"
            : "text-center py-2 mb-6"
        )}
      >
        <p
          className={cn(
            isV2
              ? "text-[14px] font-medium leading-5 text-[rgba(18,22,27,0.55)]"
              : "text-sm text-white/70"
          )}
        >
          Стоимость вопроса
        </p>
        <p
          className={cn(
            isV2
              ? "mt-2 text-[42px] font-semibold leading-none tracking-tight tabular-nums text-[#12161B]"
              : "mt-2 text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-white"
          )}
        >
          {formatRub(price)}{" "}
          <span
            className={cn(
              isV2
                ? "text-[28px] font-semibold text-[rgba(18,22,27,0.55)]"
                : "text-2xl sm:text-3xl font-semibold text-white/70"
            )}
          >
            ₽
          </span>
        </p>
        <p
          className={cn(
            isV2
              ? "mt-2 text-[13px] leading-5 text-[rgba(18,22,27,0.5)]"
              : "mt-2 text-xs text-white/60"
          )}
        >
          Будет списано сразу после оплаты
        </p>
      </section>

      {/* Payment options */}
      <section className={cn(isV2 ? "flex flex-col gap-3" : "space-y-3 mb-4")}>
        <h3
          className={cn(
            isV2
              ? "text-[14px] font-semibold leading-5 tracking-tight text-[#12161B]"
              : "text-xs font-medium uppercase tracking-wider text-white/70 px-1"
          )}
        >
          Способ оплаты
        </h3>

        {/* Balance card */}
        <PayOption
          variant={variant}
          selected={method === "balance"}
          onClick={() => setMethod("balance")}
          icon={<Wallet className="h-5 w-5" />}
          title="С баланса"
          subtitle={`На балансе: ${formatRub(balance)} ₽`}
          footer={
            <div className="flex items-center justify-between gap-3">
              {enoughBalance ? (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    isV2 ? "text-emerald-600" : "text-emerald-200"
                  )}
                >
                  <Check className="h-4 w-4" /> Достаточно средств
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    isV2 ? "text-red-500" : "text-red-300"
                  )}
                >
                  <AlertCircle className="h-4 w-4" /> Недостаточно средств
                </div>
              )}
              {!enoughBalance && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTopUp();
                  }}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition-colors",
                    isV2
                      ? "bg-[#12161B] text-white hover:opacity-85"
                      : "bg-white/95 text-slate-800 hover:bg-white"
                  )}
                >
                  Пополнить
                </button>
              )}
            </div>
          }
        />

        {/* Card */}
        <PayOption
          variant={variant}
          selected={method === "card"}
          onClick={() => setMethod("card")}
          icon={<CreditCard className="h-5 w-5" />}
          title="Банковской картой"
          subtitle="Через Альфа-Банк · Visa, Mastercard, Мир"
          footer={
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold text-red-600 tracking-wide",
                isV2 ? "bg-white border border-[rgba(18,22,27,0.08)]" : "bg-white/95"
              )}
            >
              АЛЬФА
            </span>
          }
        />
      </section>

      {/* Error banner */}
      {error && (
        <div
          className={cn(
            "rounded-xl p-3 flex items-start gap-2",
            isV2
              ? "border border-red-200 bg-red-50"
              : "border border-red-400/40 bg-red-500/15 mb-4"
          )}
        >
          <AlertCircle className={cn("h-5 w-5 mt-0.5 shrink-0", isV2 ? "text-red-500" : "text-red-300")} />
          <div className="text-sm">
            <p className={cn("font-medium", isV2 ? "text-red-600" : "text-red-200")}>Не удалось провести оплату</p>
            <p className={cn("text-xs mt-0.5", isV2 ? "text-red-500" : "text-white/70")}>{error}</p>
          </div>
        </div>
      )}

      {/* Primary button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!canPay || submitting !== null}
        className={cn(
          "w-full font-medium px-6 text-lg flex items-center justify-center gap-2 transition-all",
          isV2
            ? "h-14 rounded-[35px] text-white hover:opacity-85 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            : "py-4 rounded-2xl transition-colors",
          !canPay || submitting !== null
            ? isV2
              ? "cursor-not-allowed"
              : "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
            : isV2
              ? "text-white"
              : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
        )}
        style={
          isV2
            ? { background: "radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)" }
            : canPay && submitting === null
              ? { backgroundColor: BRAND }
              : undefined
        }
      >
        {submitting === "pay" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Обработка платежа…
          </>
        ) : (
          primaryLabel
        )}
      </button>

      {/* Pay later — hidden when caller didn't pass onPayLater (e.g. paying
          from the LK questions list, where the question is already saved). */}
      {onPayLater && (
        <button
          type="button"
          onClick={handleLater}
          disabled={submitting !== null}
          className={cn(
            "w-full text-sm transition-colors py-3 disabled:opacity-50 disabled:cursor-not-allowed",
            isV2
              ? "text-[rgba(18,22,27,0.55)] hover:text-[#34347C]"
              : "text-white/70 hover:text-white mt-2"
          )}
        >
          {submitting === "later" ? "Сохраняем…" : "Оплатить позже"}
        </button>
      )}
    </div>
  );
}

interface PayOptionProps {
  variant?: "legacy" | "v2";
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}

function PayOption({ variant = "legacy", selected, onClick, icon, title, subtitle, footer }: PayOptionProps) {
  const isV2 = variant === "v2";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-all min-h-[110px] flex",
        isV2
          ? selected
            ? "border-[1.5px] border-[#34347C] bg-white shadow-sm"
            : "border-[1.5px] border-[rgba(18,22,27,0.1)] bg-[#F7F6F9] hover:bg-white hover:border-[rgba(52,52,124,0.35)]"
          : selected
            ? "border-2 border-[#8faaba] hover:bg-white/5"
            : "border-2 border-[#8faaba]/40 hover:bg-white/5"
      )}
    >
      <div className="flex items-start gap-3 w-full">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
            isV2 ? "bg-white text-[#34347C] border border-[rgba(18,22,27,0.08)]" : "bg-white/15 text-white"
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <p className={cn("font-semibold", isV2 ? "text-[#12161B]" : "text-white")}>{title}</p>
            <p className={cn("text-sm mt-0.5", isV2 ? "text-[rgba(18,22,27,0.55)]" : "text-white/70")}>
              {subtitle}
            </p>
          </div>
          {footer && <div className="mt-auto">{footer}</div>}
        </div>
        <div
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
            isV2 ? "border-[#34347C]/45" : "border-white/70"
          )}
        >
          {selected && (
            <div className={cn("h-2.5 w-2.5 rounded-full", isV2 ? "bg-[#34347C]" : "bg-white")} />
          )}
        </div>
      </div>
    </button>
  );
}
