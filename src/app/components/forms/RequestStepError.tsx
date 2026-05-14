"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const BRAND = "#8faaba";
const REDIRECT_SECONDS = 5;

interface RequestStepErrorProps {
  /** "Перейти к моим вопросам" — question stays Unpaid in user's LK. */
  onGoToProfile: () => void;
  /** Optional override for the auto-redirect countdown length. */
  redirectAfterSec?: number;
}

/**
 * Shown when payment fails inside the wizard (balance debit error,
 * card-order creation failure, etc). The question itself has already
 * been saved as Unpaid — copy is identical to the "оплатить позже"
 * success screen, with an amber warning icon to signal that the
 * outcome differs from the user's intent.
 */
export default function RequestStepError({
  onGoToProfile,
  redirectAfterSec = REDIRECT_SECONDS,
}: RequestStepErrorProps) {
  const [secondsLeft, setSecondsLeft] = useState(redirectAfterSec);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onGoToProfile();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onGoToProfile]);

  return (
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
        <div className="h-20 w-20 rounded-2xl flex items-center justify-center border-2 border-amber-300 text-amber-300">
          <AlertTriangle className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <div className="space-y-3 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Ваш вопрос сохранён
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-white/80 leading-relaxed">
              Вопрос успешно сохранён в Личном кабинете, но пока не отправлен юристу.
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              Вы можете оплатить его в Личном кабинете в любое время в разделе «Мои заявки».
            </p>
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
