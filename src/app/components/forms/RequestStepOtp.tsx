"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { cn } from "@/src/app/components/ui/utils";
import { useOtpStep, OtpStepResult } from "@/src/app/components/forms/hooks/useOtpStep";

export type { OtpStepResult };

const CODE_LENGTH = 4;

/** Human-readable countdown for the resend button (up to 24h). */
const formatResendCountdown = (seconds: number): string => {
  if (seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  if (m > 0) return s > 0 ? `${m} мин ${s} с` : `${m} мин`;
  return `${s} с`;
};

interface RequestStepOtpProps {
  phone: string;
  onChangePhone: () => void;
  onVerify: (code: string) => Promise<OtpStepResult>;
  onResend: () => Promise<OtpStepResult>;
  initialResendCooldownSec?: number;
  initialDevCode?: string;
}

export default function RequestStepOtp({
  phone,
  onChangePhone,
  onVerify,
  onResend,
  initialResendCooldownSec = 0,
  initialDevCode,
}: RequestStepOtpProps) {
  const otp = useOtpStep({
    codeLength: CODE_LENGTH,
    resendCooldownSec: initialResendCooldownSec,
    initialDevCode,
    autoSubmit: true,
    onVerify,
    onResend,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!otp.inputDisabled) inputRef.current?.focus();
  }, [otp.inputDisabled]);

  return (
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Подтверждение</h2>
      <p className="text-white/80 text-sm leading-relaxed mb-2">
        Мы отправили SMS-код на указанный номер. Введите его ниже.
      </p>
      <p className="text-white/80 text-sm leading-relaxed mb-4">
        Код отправлен на <span className="font-semibold text-white">{phone}</span>.{" "}
        <button
          type="button"
          onClick={onChangePhone}
          disabled={otp.verifying}
          className="text-[#a9c4d2] hover:text-white underline transition-colors disabled:opacity-50"
        >
          Изменить номер
        </button>
      </p>

      {otp.blockBanner && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/40 flex items-start gap-2">
          <Lock className="w-5 h-5 text-red-300 shrink-0 mt-px" />
          <p className="text-sm text-red-200">{otp.blockBanner.text}</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          disabled={otp.inputDisabled}
          className="w-full block disabled:cursor-not-allowed"
        >
          <div className="flex justify-between gap-2">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const ch = otp.code[i] ?? "";
              const isActive = i === otp.code.length && !otp.inputDisabled;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-14 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold tabular-nums transition-colors",
                    otp.inputDisabled
                      ? "border-white/20 bg-white/5 text-white/40"
                      : ch
                      ? "border-[#8faaba] bg-[#8faaba]/15 text-white"
                      : isActive
                      ? "border-white text-white"
                      : "border-white/30 text-white"
                  )}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        </button>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={otp.code}
          disabled={otp.inputDisabled}
          onChange={(e) => otp.onCodeChange(e.target.value)}
          className="sr-only"
        />

        {!otp.blockBanner && otp.error && (
          <p className="text-sm text-red-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" /> {otp.error}
          </p>
        )}

        {!otp.blockBanner && otp.attemptsLeft !== null && otp.attemptsLeft > 0 && (
          <p className="text-xs text-white/60">
            Осталось попыток: <span className="font-semibold text-white">{otp.attemptsLeft}</span>
          </p>
        )}

        <p className="text-[12px] text-white/60">Срок действия кода — 24 часа.</p>

        <button
          type="button"
          onClick={() => void otp.submit()}
          disabled={!otp.canSubmit}
          className={cn(
            "w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg",
            !otp.canSubmit
              ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
              : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
          )}
        >
          {otp.verifying ? "Проверяем…" : "Подтвердить"}
        </button>

        {!otp.lockoutActive && (
          <button
            type="button"
            onClick={() => void otp.resend()}
            disabled={!otp.canResend}
            className={cn(
              "w-full text-sm transition-colors py-2",
              otp.canResend
                ? "text-white/80 hover:text-white"
                : "text-white/40 cursor-not-allowed"
            )}
          >
            {otp.resendRemainingSec > 0
              ? `Отправить код повторно через ${formatResendCountdown(otp.resendRemainingSec)}`
              : "Отправить код повторно"}
          </button>
        )}
      </div>
    </div>
  );
}
