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
  /** Handles the card-payment flow (create Alfa order → redirect to formUrl). */
  onPayCard: () => Promise<{ ok: boolean; message?: string }>;
  /** Handles the balance-payment flow (stub for task 7 for now). */
  onPayBalance: () => Promise<{ ok: boolean; message?: string }>;
  /** Creates an unpaid question and redirects to the profile. */
  onPayLater: () => Promise<{ ok: boolean; message?: string }>;
  /** Redirects to the balance top-up screen. */
  onTopUp: () => void;
}

const formatRub = (n: number): string =>
  new Intl.NumberFormat("ru-RU").format(n);

export default function RequestStepPayment({
  price,
  balance,
  onPayCard,
  onPayBalance,
  onPayLater,
  onTopUp,
}: RequestStepPaymentProps) {
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [submitting, setSubmitting] = useState<"pay" | "later" | null>(null);
  const [error, setError] = useState<string>("");

  const enoughBalance = balance >= price;
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
    if (submitting) return;
    setError("");
    setSubmitting("later");
    const res = await onPayLater();
    if (!res.ok) {
      setError(res.message ?? "Не удалось сохранить вопрос.");
      setSubmitting(null);
    }
  };

  return (
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
      {/* Price block */}
      <section className="text-center py-2 mb-6">
        <p className="text-sm text-white/70">Стоимость вопроса</p>
        <p className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-white">
          {formatRub(price)} <span className="text-2xl sm:text-3xl font-semibold text-white/70">₽</span>
        </p>
        <p className="mt-2 text-xs text-white/60">Будет списано сразу после оплаты</p>
      </section>

      {/* Payment options */}
      <section className="space-y-3 mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-white/70 px-1">Способ оплаты</h3>

        {/* Balance card */}
        <PayOption
          selected={method === "balance"}
          onClick={() => setMethod("balance")}
          icon={<Wallet className="h-5 w-5" />}
          title="С баланса"
          subtitle={`На балансе: ${formatRub(balance)} ₽`}
          footer={
            <div className="flex items-center justify-between gap-3">
              {enoughBalance ? (
                <div className="flex items-center gap-1.5 text-emerald-200 text-sm font-medium">
                  <Check className="h-4 w-4" /> Достаточно средств
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-300 text-sm font-medium">
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
                  className="inline-flex h-8 items-center rounded-md bg-white/95 px-3 text-xs font-semibold text-slate-800 hover:bg-white transition-colors"
                >
                  Пополнить
                </button>
              )}
            </div>
          }
        />

        {/* Card */}
        <PayOption
          selected={method === "card"}
          onClick={() => setMethod("card")}
          icon={<CreditCard className="h-5 w-5" />}
          title="Банковской картой"
          subtitle="Через Альфа-Банк · Visa, Mastercard, Мир"
          footer={
            <span className="inline-flex items-center justify-center rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold text-red-600 tracking-wide">
              АЛЬФА
            </span>
          }
        />
      </section>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/15 p-3 flex items-start gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-300 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-red-200">Не удалось провести оплату</p>
            <p className="text-white/70 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Primary button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!canPay || submitting !== null}
        className={cn(
          "w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg flex items-center justify-center gap-2",
          !canPay || submitting !== null
            ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
            : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
        )}
        style={canPay && submitting === null ? { backgroundColor: BRAND } : undefined}
      >
        {submitting === "pay" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Обработка платежа…
          </>
        ) : (
          primaryLabel
        )}
      </button>

      {/* Pay later */}
      <button
        type="button"
        onClick={handleLater}
        disabled={submitting !== null}
        className="w-full text-sm text-white/70 hover:text-white transition-colors py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting === "later" ? "Сохраняем…" : "Оплатить позже"}
      </button>
    </div>
  );
}

interface PayOptionProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}

function PayOption({ selected, onClick, icon, title, subtitle, footer }: PayOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-all hover:bg-white/5 min-h-[110px] flex border-2",
        selected ? "border-[#8faaba]" : "border-[#8faaba]/40"
      )}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 bg-white/15 text-white">
          {icon}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <p className="font-semibold text-white">{title}</p>
            <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
          </div>
          {footer && <div className="mt-auto">{footer}</div>}
        </div>
        <div className="h-5 w-5 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
          {selected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}
