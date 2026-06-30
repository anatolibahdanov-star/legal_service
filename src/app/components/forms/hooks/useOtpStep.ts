"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CODE_LENGTH = 4;
const DEFAULT_RESEND_COOLDOWN_SEC = 60;

export interface OtpStepResult {
  ok: boolean;
  message?: string;
  cooldownUntil?: string | Date | null;
  lockedUntil?: string | Date | null;
  attemptsLeft?: number | null;
  devCode?: string;
  expiresInSec?: number;
}

export interface UseOtpStepOptions {
  codeLength?: number;
  resendCooldownSec?: number;
  expiresInSec?: number;
  initialDevCode?: string;
  autoSubmit?: boolean;
  onVerify: (code: string) => Promise<OtpStepResult>;
  onResend: () => Promise<OtpStepResult>;
}

export interface BlockBanner {
  kind: "cooldown" | "lockout";
  text: string;
}

export interface UseOtpStepReturn {
  // value
  code: string;
  onCodeChange: (raw: string) => void;
  // states
  verifying: boolean;
  error: string;
  attemptsLeft: number | null;
  cooldownActive: boolean;
  lockoutActive: boolean;
  isBlocked: boolean;
  inputDisabled: boolean;
  canSubmit: boolean;
  canResend: boolean;
  cooldownRemainingSec: number;
  resendRemainingSec: number;
  expiryRemainingSec: number;
  blockBanner: BlockBanner | null;
  devCode: string | undefined;
  // actions
  submit: () => Promise<void>;
  resend: () => Promise<void>;
}

const toDate = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export const formatOtpDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function useOtpStep({
  codeLength = DEFAULT_CODE_LENGTH,
  resendCooldownSec = DEFAULT_RESEND_COOLDOWN_SEC,
  expiresInSec,
  initialDevCode,
  autoSubmit = false,
  onVerify,
  onResend,
}: UseOtpStepOptions): UseOtpStepReturn {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [resendUntil, setResendUntil] = useState<Date | null>(() =>
    resendCooldownSec > 0 ? new Date(Date.now() + resendCooldownSec * 1000) : null
  );
  const [expiryUntil, setExpiryUntil] = useState<Date | null>(() =>
    expiresInSec && expiresInSec > 0 ? new Date(Date.now() + expiresInSec * 1000) : null
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [devCode, setDevCode] = useState<string | undefined>(initialDevCode);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cooldownActive = !!cooldownUntil && cooldownUntil.getTime() > nowMs;
  const lockoutActive = !!lockedUntil && lockedUntil.getTime() > nowMs;
  const isBlocked = cooldownActive || lockoutActive;
  const cooldownRemainingSec = cooldownActive
    ? Math.ceil((cooldownUntil!.getTime() - nowMs) / 1000)
    : 0;
  const resendRemainingSec = resendUntil
    ? Math.max(0, Math.ceil((resendUntil.getTime() - nowMs) / 1000))
    : 0;
  const expiryRemainingSec = expiryUntil
    ? Math.max(0, Math.ceil((expiryUntil.getTime() - nowMs) / 1000))
    : 0;
  const inputDisabled = verifying || isBlocked;
  const canSubmit = code.length === codeLength && !inputDisabled;
  const canResend = !verifying && !isBlocked && resendRemainingSec === 0;

  const submitInternal = useCallback(
    async (value: string) => {
      if (verifying || isBlocked) return;
      if (value.length !== codeLength) return;
      setError("");
      setVerifying(true);
      const res = await onVerify(value);
      setVerifying(false);
      if (res.ok) return;
      const newCooldown = toDate(res.cooldownUntil);
      const newLocked = toDate(res.lockedUntil);
      if (newLocked) setLockedUntil(newLocked);
      if (newCooldown) setCooldownUntil(newCooldown);
      if (newLocked || newCooldown) {
        setError("");
      } else if (res.message) {
        setError(res.message);
      }
      setAttemptsLeft(typeof res.attemptsLeft === "number" ? res.attemptsLeft : null);
      setCode("");
    },
    [verifying, isBlocked, codeLength, onVerify]
  );

  // Use a ref so onCodeChange isn't recreated when submitInternal identity changes —
  // keeps the input's onChange handler stable.
  const submitRef = useRef(submitInternal);
  useEffect(() => {
    submitRef.current = submitInternal;
  }, [submitInternal]);

  const onCodeChange = useCallback(
    (raw: string) => {
      const v = raw.replace(/\D/g, "").slice(0, codeLength);
      setCode(v);
      setError("");
      setAttemptsLeft(null);
      if (autoSubmit && v.length === codeLength) {
        void submitRef.current(v);
      }
    },
    [codeLength, autoSubmit]
  );

  const submit = useCallback(async () => {
    await submitInternal(code);
  }, [submitInternal, code]);

  const resend = useCallback(async () => {
    if (!canResend) return;
    setError("");
    setVerifying(true);
    const res = await onResend();
    setVerifying(false);
    if (res.ok) {
      if (resendCooldownSec > 0) {
        setResendUntil(new Date(Date.now() + resendCooldownSec * 1000));
      }
      if (typeof res.expiresInSec === "number" && res.expiresInSec > 0) {
        setExpiryUntil(new Date(Date.now() + res.expiresInSec * 1000));
      }
      setCode("");
      setCooldownUntil(null);
      setAttemptsLeft(null);
      if (res.devCode) setDevCode(res.devCode);
      return;
    }
    const newCooldown = toDate(res.cooldownUntil);
    const newLocked = toDate(res.lockedUntil);
    if (newLocked) setLockedUntil(newLocked);
    if (newCooldown) setCooldownUntil(newCooldown);
    if (newLocked || newCooldown) {
      setError("");
    } else if (res.message) {
      setError(res.message);
    }
  }, [canResend, onResend, resendCooldownSec]);

  const blockBanner = useMemo<BlockBanner | null>(() => {
    if (lockoutActive) {
      return {
        kind: "lockout",
        text: "Слишком много попыток. Номер заблокирован на 24 часа.",
      };
    }
    if (cooldownActive) {
      return {
        kind: "cooldown",
        text: `Слишком много попыток. Попробуйте через ${formatOtpDuration(cooldownRemainingSec)}.`,
      };
    }
    return null;
  }, [lockoutActive, cooldownActive, cooldownRemainingSec]);

  return {
    code,
    onCodeChange,
    verifying,
    error,
    attemptsLeft,
    cooldownActive,
    lockoutActive,
    isBlocked,
    inputDisabled,
    canSubmit,
    canResend,
    cooldownRemainingSec,
    resendRemainingSec,
    expiryRemainingSec,
    blockBanner,
    devCode,
    submit,
    resend,
  };
}
