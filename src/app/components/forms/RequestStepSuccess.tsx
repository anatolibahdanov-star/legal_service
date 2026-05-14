"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, CreditCard, Gift, Wallet } from "lucide-react";

const BRAND = "#8faaba";
const REDIRECT_SECONDS = 5;

export type SuccessVariant = "free" | "balance" | "card" | "later";

interface RequestStepSuccessProps {
  /** Drives the icon / heading / subtitle / amount block. */
  variant: SuccessVariant;
  /** Amount paid (rubles). Used for "balance" and "card" variants. */
  amount?: number;
  /** Called both on auto-redirect (after countdown) and on manual button click. */
  onGoToProfile: () => void;
  /** Optional override for the countdown length. */
  redirectAfterSec?: number;
}

const formatRub = (n: number): string => new Intl.NumberFormat("ru-RU").format(n);

interface VariantCopy {
  heading: string;
  /** Two-paragraph subtitle: each item rendered as its own <p>. */
  paragraphs: string[];
  icon: typeof CheckCircle2;
}

const buildVariantCopy = (variant: SuccessVariant, amount: number): VariantCopy => {
  switch (variant) {
    case "free":
      return {
        heading: "Ваш вопрос принят",
        paragraphs: [
          "Поздравляем! Первый вопрос для Вас бесплатный.",
          "Вопрос успешно сохранён и отправлен юристу. Ответ придёт в Личный кабинет и на Вашу электронную почту.",
        ],
        icon: Gift,
      };
    case "balance":
      return {
        heading: "Ваш вопрос принят",
        paragraphs: [
          `С баланса успешно списано ${formatRub(amount)} ₽`,
          "Ваш вопрос сохранён и отправлен юристу. Ответ придёт в Личный кабинет и на Вашу электронную почту.",
        ],
        icon: Wallet,
      };
    case "card":
      return {
        heading: "Ваш вопрос принят",
        paragraphs: [
          `С карты успешно списано ${formatRub(amount)} ₽`,
          "Ваш вопрос сохранён и отправлен на рассмотрение юристу. Ответ придёт в Личный кабинет и на Вашу электронную почту.",
        ],
        icon: CreditCard,
      };
    case "later":
      return {
        heading: "Ваш вопрос сохранён",
        paragraphs: [
          "Вопрос успешно сохранён в Личном кабинете, но пока не отправлен юристу.",
          "Вы можете оплатить его в Личном кабинете в любое время в разделе «Мои заявки».",
        ],
        icon: Clock,
      };
  }
};

export default function RequestStepSuccess({
  variant,
  amount = 0,
  onGoToProfile,
  redirectAfterSec = REDIRECT_SECONDS,
}: RequestStepSuccessProps) {
  const [secondsLeft, setSecondsLeft] = useState(redirectAfterSec);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onGoToProfile();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onGoToProfile]);

  const { heading, paragraphs, icon: Icon } = buildVariantCopy(variant, amount);

  return (
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center border-2"
          style={{ borderColor: BRAND, color: BRAND }}
        >
          <Icon className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <div className="space-y-3 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-white">{heading}</h2>
          <div className="space-y-2">
            {paragraphs.map((text, i) => (
              <p key={i} className="text-sm text-white/80 leading-relaxed">
                {text}
              </p>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button
            type="button"
            onClick={onGoToProfile}
            className="w-full h-12 rounded-2xl text-base font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Перейти к моим вопросам
          </button>
          <p className="text-xs text-white/60 tabular-nums">
            Автоматический переход через {secondsLeft} с
          </p>
        </div>
      </div>
    </div>
  );
}
