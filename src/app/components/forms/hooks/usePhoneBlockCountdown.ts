"use client";

import { useCallback, useEffect, useState } from "react";
import { formatOtpDuration } from "@/src/app/components/forms/hooks/useOtpStep";

/**
 * Phone-input lockout/cooldown countdown for the phone-entry step of auth,
 * registration, password reset and the question wizard. Server endpoints
 * return `lockedUntil` (24h ban) and/or `cooldownUntil` (5min throttle) as
 * ISO strings; this hook stores them, ticks once per second, exposes
 * MM:SS-formatted remaining time, and auto-clears state when the timer
 * expires so the form re-enables itself without a page reload.
 *
 * Returns a setter pair `applyFromServer` that takes the raw server payload
 * and parses `lockedUntil`/`cooldownUntil`, plus `reset()` for "user
 * started typing again" cases.
 */
export interface PhoneBlockCountdown {
  locked: boolean;
  cooldown: boolean;
  blocked: boolean;
  lockedRemainingSec: number;
  cooldownRemainingSec: number;
  /** MM:SS (or H:MM if > 1h) of whichever timer is active; "0:00" if none. */
  remainingLabel: string;
  applyFromServer: (payload: { lockedUntil?: string | Date | null; cooldownUntil?: string | Date | null } | null | undefined) => void;
  reset: () => void;
}

const toDate = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export function usePhoneBlockCountdown(): PhoneBlockCountdown {
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Single 1s ticker only when something is actively counting down — no point
  // running an interval if both timers are null/expired.
  const active = !!lockedUntil || !!cooldownUntil;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  // Auto-clear expired timers so the form unlocks the moment the deadline passes.
  useEffect(() => {
    if (lockedUntil && lockedUntil.getTime() <= nowMs) setLockedUntil(null);
    if (cooldownUntil && cooldownUntil.getTime() <= nowMs) setCooldownUntil(null);
  }, [lockedUntil, cooldownUntil, nowMs]);

  const lockedRemainingSec = lockedUntil
    ? Math.max(0, Math.ceil((lockedUntil.getTime() - nowMs) / 1000))
    : 0;
  const cooldownRemainingSec = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil.getTime() - nowMs) / 1000))
    : 0;
  const locked = lockedRemainingSec > 0;
  const cooldown = cooldownRemainingSec > 0;

  const remainingLabel = formatOtpDuration(
    locked ? lockedRemainingSec : cooldown ? cooldownRemainingSec : 0,
  );

  const applyFromServer = useCallback<PhoneBlockCountdown["applyFromServer"]>(
    (payload) => {
      const newLocked = toDate(payload?.lockedUntil);
      const newCooldown = toDate(payload?.cooldownUntil);
      if (newLocked) setLockedUntil(newLocked);
      if (newCooldown) setCooldownUntil(newCooldown);
      // Sync the ticker tick so the first rendered countdown isn't a stale
      // value from the previous render.
      if (newLocked || newCooldown) setNowMs(Date.now());
    },
    [],
  );

  const reset = useCallback(() => {
    setLockedUntil(null);
    setCooldownUntil(null);
  }, []);

  return {
    locked,
    cooldown,
    blocked: locked || cooldown,
    lockedRemainingSec,
    cooldownRemainingSec,
    remainingLabel,
    applyFromServer,
    reset,
  };
}
