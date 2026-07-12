"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import {
  useOtpStep,
  formatOtpDuration,
  OtpStepResult,
} from "@/src/app/components/forms/hooks/useOtpStep";

export type { OtpStepResult };

const FIELD_BG = "bg-[#f7f6f9] border border-[rgba(18,22,27,0.1)]";
const CODE_LENGTH = 4;

interface Props {
  phone: string;
  /** Async verify. Component leaves submit state to caller's resolution. */
  onVerify: (code: string) => Promise<OtpStepResult>;
  /** Async resend. */
  onResend: () => Promise<OtpStepResult>;
  /** Synchronous "go back to phone step" callback. */
  onChangePhone: () => void;
  /** Resend cooldown seconds set by parent after first send. 0 means resend is allowed immediately. */
  initialResendCooldown?: number;
  /** OTP code lifetime in seconds (from send-otp). Drives the live expiry countdown. */
  initialExpiresInSec?: number;
}

export default function OtpCodeStep({
  phone,
  onVerify,
  onResend,
  onChangePhone,
  initialResendCooldown = 0,
  initialExpiresInSec = 0,
}: Props) {
  const otp = useOtpStep({
    codeLength: CODE_LENGTH,
    resendCooldownSec: initialResendCooldown,
    expiresInSec: initialExpiresInSec,
    onVerify,
    onResend,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canChangePhone = !otp.verifying;

  useEffect(() => {
    if (!otp.inputDisabled) inputRef.current?.focus();
  }, [otp.inputDisabled]);

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#12161b] mb-[10px]">
          Подтверждение
        </h1>
        <p className="text-[14px] leading-[22px] text-[rgba(18,22,27,0.6)]">
          Мы отправили SMS-код на указанный номер. Введите его ниже.
        </p>
        <p className="text-[14px] leading-[22px] text-[rgba(18,22,27,0.6)] mt-[6px]">
          Код отправлен на <span className="text-[#12161b] font-medium">{phone}</span>.{" "}
          <button
            type="button"
            onClick={onChangePhone}
            disabled={!canChangePhone}
            className="text-[#34347c] hover:opacity-80 font-semibold transition-colors disabled:text-[#12161b]/40 disabled:cursor-not-allowed"
          >
            Изменить номер
          </button>
        </p>
      </div>

      {otp.blockBanner && (
        <div
          className={`mb-[18px] px-[16px] py-[12px] rounded-[12px] text-[13px] leading-[18px] ${
            otp.blockBanner.kind === "lockout"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
          role="alert"
        >
          {otp.blockBanner.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void otp.submit();
        }}
        className="flex flex-col gap-[18px]"
        noValidate
      >
        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#12161b]">Код из SMS</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={otp.code}
              disabled={otp.inputDisabled}
              onChange={(e) => otp.onCodeChange(e.target.value)}
              placeholder={"•".repeat(CODE_LENGTH)}
              className={`w-full h-full px-[16px] bg-transparent text-[20px] tracking-[8px] text-center text-[#12161b] placeholder:text-[#12161b]/30 rounded-[14px] outline-none ring-2 ${
                otp.error && !otp.blockBanner
                  ? "ring-red-400"
                  : "ring-transparent focus:ring-[#34347c]/35"
              } transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
            />
          </div>
          <p className="text-[12px] text-[rgba(18,22,27,0.6)] ml-[4px]">
            {otp.expiryRemainingSec > 0
              ? `Код действителен ещё ${formatOtpDuration(otp.expiryRemainingSec)}`
              : "Срок действия кода истёк. Запросите новый."}
          </p>
          {otp.error && !otp.blockBanner && (
            <p className="text-[12px] text-red-500 ml-[4px]">{otp.error}</p>
          )}
          {!otp.blockBanner && otp.attemptsLeft !== null && otp.attemptsLeft > 0 && (
            <p className="text-[12px] text-[rgba(18,22,27,0.6)] ml-[4px]">
              Осталось попыток: <span className="font-bold text-[#12161b]">{otp.attemptsLeft}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!otp.canSubmit}
          className={`h-[52px] rounded-[35px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
            otp.canSubmit
              ? "bg-[radial-gradient(circle_at_50%_0%,#34347c_0%,#2d2d6c_100%)] text-white hover:opacity-90"
              : "bg-[#e8e7ed] text-[#12161b]/50 cursor-not-allowed"
          }`}
        >
          {otp.verifying ? "Проверяем…" : "Подтвердить"}
          {!otp.verifying && <ArrowRight className="w-4 h-4" />}
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => void otp.resend()}
            disabled={!otp.canResend}
            className="text-[14px] font-semibold text-[#34347c] hover:opacity-80 transition-colors disabled:text-[#12161b]/40 disabled:cursor-not-allowed"
          >
            {otp.resendRemainingSec > 0
              ? `Отправить код повторно (${formatOtpDuration(otp.resendRemainingSec)})`
              : "Отправить код повторно"}
          </button>
        </div>
      </form>
    </>
  );
}
