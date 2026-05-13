"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

const BRAND = "#8faaba";
const REDIRECT_SECONDS = 5;

interface RequestStepSuccessProps {
  /** True for paid or free-benefit questions, false for "оплатить позже" (unpaid). */
  paid: boolean;
  /** Called both on auto-redirect (after countdown) and on manual button click. */
  onGoToProfile: () => void;
  /** Optional override for the countdown length. */
  redirectAfterSec?: number;
}

export default function RequestStepSuccess({
  paid,
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

  const subtitle = paid
    ? "Юрист уже приступил к работе. Ответ придёт на email."
    : "Вопрос сохранён, но не отправлен юристу. Оплатите его позже из личного кабинета.";

  return (
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center border-2"
          style={{ borderColor: BRAND, color: BRAND }}
        >
          {paid ? (
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.5} />
          ) : (
            <Clock className="h-10 w-10" strokeWidth={1.5} />
          )}
        </div>

        <div className="space-y-2 max-w-xs">
          <h2 className="text-2xl font-bold tracking-tight text-white">Ваш вопрос принят</h2>
          <p className="text-sm text-white/70 leading-relaxed">{subtitle}</p>
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
