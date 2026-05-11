"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

const FIELD_BG = "bg-[#EFE7D8]";
const CODE_LENGTH = 6;

export interface OtpStepResult {
  ok: boolean;
  message?: string;
  cooldownUntil?: string | Date | null;
  lockedUntil?: string | Date | null;
  attemptsLeft?: number | null;
}

interface Props {
  phone: string;
  /** Async verify. Component leaves submit state to caller's resolution. */
  onVerify: (code: string) => Promise<OtpStepResult>;
  /** Async resend. */
  onResend: () => Promise<OtpStepResult>;
  /** Synchronous "go back to phone step" callback. */
  onChangePhone: () => void;
  /** Resend cooldown seconds set by parent after first send. */
  initialResendCooldown?: number;
}

const toDate = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const formatMmSs = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function OtpCodeStep({
  phone,
  onVerify,
  onResend,
  onChangePhone,
  initialResendCooldown = 30,
}: Props) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [resendUntil, setResendUntil] = useState<Date | null>(() =>
    initialResendCooldown > 0 ? new Date(Date.now() + initialResendCooldown * 1000) : null,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cooldownActive = !!cooldownUntil && cooldownUntil.getTime() > nowMs;
  const lockoutActive = !!lockedUntil && lockedUntil.getTime() > nowMs;
  const cooldownRemainingSec = cooldownActive
    ? Math.ceil((cooldownUntil!.getTime() - nowMs) / 1000)
    : 0;
  const resendRemainingSec = resendUntil
    ? Math.max(0, Math.ceil((resendUntil.getTime() - nowMs) / 1000))
    : 0;

  const inputDisabled = submitting || cooldownActive || lockoutActive;
  const canSubmit = code.length === CODE_LENGTH && !inputDisabled;
  const canResend = !submitting && !cooldownActive && !lockoutActive && resendRemainingSec === 0;
  const canChangePhone = !lockoutActive && !submitting;

  useEffect(() => {
    if (!inputDisabled) {
      inputRef.current?.focus();
    }
  }, [inputDisabled]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setErrorMessage("");
      setSubmitting(true);
      const res = await onVerify(code);
      setSubmitting(false);
      if (res.ok) return;
      const newCooldown = toDate(res.cooldownUntil);
      const newLocked = toDate(res.lockedUntil);
      if (newLocked) setLockedUntil(newLocked);
      if (newCooldown) setCooldownUntil(newCooldown);
      if (res.message) setErrorMessage(res.message);
      setAttemptsLeft(typeof res.attemptsLeft === "number" ? res.attemptsLeft : null);
      setCode("");
    },
    [canSubmit, code, onVerify],
  );

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setErrorMessage("");
    setSubmitting(true);
    const res = await onResend();
    setSubmitting(false);
    if (res.ok) {
      setResendUntil(new Date(Date.now() + initialResendCooldown * 1000));
      setCode("");
      setCooldownUntil(null);
      setAttemptsLeft(null);
      return;
    }
    const newCooldown = toDate(res.cooldownUntil);
    const newLocked = toDate(res.lockedUntil);
    if (newLocked) setLockedUntil(newLocked);
    if (newCooldown) setCooldownUntil(newCooldown);
    if (res.message) setErrorMessage(res.message);
  }, [canResend, onResend, initialResendCooldown]);

  const banner = useMemo(() => {
    if (lockoutActive) {
      return {
        kind: "lockout" as const,
        text: "Слишком много попыток. Номер заблокирован на 24 часа.",
      };
    }
    if (cooldownActive) {
      return {
        kind: "cooldown" as const,
        text: `Слишком много попыток. Попробуйте через ${formatMmSs(cooldownRemainingSec)}.`,
      };
    }
    return null;
  }, [lockoutActive, cooldownActive, cooldownRemainingSec]);

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
          Подтверждение
        </h1>
        <p className="text-[14px] leading-[22px] text-[#6B7280]">
          Мы отправили SMS-код на указанный номер. Введите его ниже.
        </p>
        <p className="text-[14px] leading-[22px] text-[#6B7280] mt-[6px]">
          Код отправлен на <span className="text-[#0F1B2D] font-medium">{phone}</span>.{" "}
          <button
            type="button"
            onClick={onChangePhone}
            disabled={!canChangePhone}
            className="text-[#3B82F6] hover:text-[#2563EB] font-semibold transition-colors disabled:text-[#0F1B2D]/40 disabled:cursor-not-allowed"
          >
            Изменить номер
          </button>
        </p>
      </div>

      {banner && (
        <div
          className={`mb-[18px] px-[16px] py-[12px] rounded-[12px] text-[13px] leading-[18px] ${
            banner.kind === "lockout"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
          role="alert"
        >
          {banner.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#0F1B2D]">Код из SMS</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={code}
              disabled={inputDisabled}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
                if (errorMessage) setErrorMessage("");
                if (attemptsLeft !== null) setAttemptsLeft(null);
              }}
              placeholder="••••••"
              className={`w-full h-full px-[16px] bg-transparent text-[20px] tracking-[8px] text-center text-[#0F1B2D] placeholder:text-[#0F1B2D]/30 rounded-[14px] outline-none ring-2 ${
                errorMessage && !banner ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
            />
          </div>
          <p className="text-[12px] text-[#6B7280] ml-[4px]">Срок действия кода — 24 часа.</p>
          {errorMessage && !banner && (
            <p className="text-[12px] text-red-500 ml-[4px]">{errorMessage}</p>
          )}
          {!banner && attemptsLeft !== null && attemptsLeft > 0 && (
            <p className="text-[12px] text-[#6B7280] ml-[4px]">
              Осталось попыток: <span className="font-bold text-[#0F1B2D]">{attemptsLeft}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
            canSubmit
              ? "bg-[#5A8FB5] text-white hover:bg-[#4A7EA3]"
              : "bg-[#D6E3EF] text-[#0F1B2D]/50 cursor-not-allowed"
          }`}
        >
          {submitting ? "Проверяем…" : "Подтвердить"}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="text-[14px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors disabled:text-[#0F1B2D]/40 disabled:cursor-not-allowed"
          >
            {resendRemainingSec > 0
              ? `Отправить код повторно (${resendRemainingSec})`
              : "Отправить код повторно"}
          </button>
        </div>
      </form>
    </>
  );
}
