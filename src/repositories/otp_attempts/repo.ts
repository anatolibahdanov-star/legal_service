import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { findOne, insert, executeTransactionWrapper } from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { getSettingInt } from '@/src/services/settings';

const msgGlobal = 'REPO OTP_ATTEMPTS ';

// Defaults per ENKI-21: attempt 3 → cooldown; attempt 5 → lock.
// Now configurable via system settings (otp_*); these are the fallbacks.
const DEFAULT_COOLDOWN_TRIGGER = 3;
const DEFAULT_LOCKOUT_TRIGGER = 5;
const DEFAULT_COOLDOWN_MINUTES = 5;
const DEFAULT_LOCKOUT_MINUTES = 24 * 60;

export const otpMaxAttempts = (): number => Math.max(1, getSettingInt('otp_max_attempts', DEFAULT_LOCKOUT_TRIGGER));
export const otpCooldownTrigger = (): number => Math.max(1, getSettingInt('otp_cooldown_attempts', DEFAULT_COOLDOWN_TRIGGER));
const otpLockMs = (): number => Math.max(1, getSettingInt('otp_lock_minutes', DEFAULT_LOCKOUT_MINUTES)) * 60 * 1000;
const otpCooldownMs = (): number => Math.max(1, getSettingInt('otp_cooldown_minutes', DEFAULT_COOLDOWN_MINUTES)) * 60 * 1000;

export interface DBOtpAttempts extends RowDataPacket {
  phone: string;
  attempts: number;
  locked_until: Date | null;
  cooldown_until: Date | null;
  last_attempt_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type FailAction = 'continue' | 'cooldown_5min' | 'lock_24h';

export interface RecordFailResult {
  attempts: number;
  action: FailAction;
  cooldownUntil: Date | null;
  lockedUntil: Date | null;
  /** Remaining wrong attempts before the lock kicks in (>= 0). */
  attemptsLeft: number;
}

export async function getOtpAttempts(phone: string): Promise<DBOtpAttempts | null> {
  const msg = msgGlobal + 'getOtpAttempts - ';
  const query = 'SELECT * FROM otp_attempts WHERE phone = ? LIMIT 1';
  const findFunc = findOne({ query, values: [phone] });
  const executed = await executeTransactionWrapper<DBOtpAttempts[]>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no result from db', { phone_tail: phone.slice(-4) });
    return null;
  }
  const [rows] = executed[0];
  return rows[0] ?? null;
}

export interface PhoneStatus {
  locked: boolean;
  lockedUntil: Date | null;
  lockedRemainingSec: number;
  cooldown: boolean;
  cooldownUntil: Date | null;
  cooldownRemainingSec: number;
}

export async function getPhoneStatus(phone: string): Promise<PhoneStatus> {
  const row = await getOtpAttempts(phone);
  const now = Date.now();
  const lockedUntil = row?.locked_until ?? null;
  const cooldownUntil = row?.cooldown_until ?? null;
  const lockedTs = lockedUntil ? new Date(lockedUntil).getTime() : 0;
  const cooldownTs = cooldownUntil ? new Date(cooldownUntil).getTime() : 0;
  return {
    locked: lockedTs > now,
    lockedUntil: lockedTs > now ? new Date(lockedTs) : null,
    lockedRemainingSec: lockedTs > now ? Math.ceil((lockedTs - now) / 1000) : 0,
    cooldown: cooldownTs > now,
    cooldownUntil: cooldownTs > now ? new Date(cooldownTs) : null,
    cooldownRemainingSec: cooldownTs > now ? Math.ceil((cooldownTs - now) / 1000) : 0,
  };
}

export async function recordFailedAttempt(phone: string): Promise<RecordFailResult> {
  const msg = msgGlobal + 'recordFailedAttempt - ';
  const now = new Date();

  const existing = await getOtpAttempts(phone);
  const prevLockedUntil = existing?.locked_until ? new Date(existing.locked_until) : null;
  const lockExpired = prevLockedUntil !== null && prevLockedUntil.getTime() <= now.getTime();

  // If the 24-hour lock has expired — counter and cooldown reset (penalty served).
  // The 5-min cooldown alone does NOT reset the counter: after waiting, the user continues
  // from where they left off, and on the 5th wrong attempt gets a 24h lock.
  const baseAttempts = lockExpired ? 0 : existing?.attempts ?? 0;
  const nextAttempts = baseAttempts + 1;

  const lockoutTrigger = otpMaxAttempts();
  const cooldownTrigger = otpCooldownTrigger();

  let action: FailAction = 'continue';
  let cooldownUntil: Date | null = lockExpired ? null : existing?.cooldown_until ?? null;
  let lockedUntil: Date | null = lockExpired ? null : prevLockedUntil;

  if (nextAttempts >= lockoutTrigger) {
    action = 'lock_24h';
    lockedUntil = new Date(now.getTime() + otpLockMs());
    cooldownUntil = null;
  } else if (nextAttempts === cooldownTrigger) {
    action = 'cooldown_5min';
    cooldownUntil = new Date(now.getTime() + otpCooldownMs());
  }

  const upsertQuery = `
    INSERT INTO otp_attempts (phone, attempts, locked_until, cooldown_until, last_attempt_at)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      attempts = VALUES(attempts),
      locked_until = VALUES(locked_until),
      cooldown_until = VALUES(cooldown_until),
      last_attempt_at = VALUES(last_attempt_at)
  `;
  const params = [phone, nextAttempts, lockedUntil, cooldownUntil, now];
  const insertFunc = insert({ query: upsertQuery, values: params });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'upsert failed', { phone_tail: phone.slice(-4) });
  }

  logger.info(msg + 'recorded', {
    phone_tail: phone.slice(-4),
    attempts: nextAttempts,
    action,
  });
  return {
    attempts: nextAttempts,
    action,
    cooldownUntil,
    lockedUntil,
    attemptsLeft: Math.max(0, lockoutTrigger - nextAttempts),
  };
}

export async function resetAttempts(phone: string): Promise<void> {
  const msg = msgGlobal + 'resetAttempts - ';
  const query = `
    INSERT INTO otp_attempts (phone, attempts, locked_until, cooldown_until, last_attempt_at)
    VALUES (?, 0, NULL, NULL, NULL)
    ON DUPLICATE KEY UPDATE
      attempts = 0,
      locked_until = NULL,
      cooldown_until = NULL,
      last_attempt_at = NULL
  `;
  const insertFunc = insert({ query, values: [phone] });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'reset failed', { phone_tail: phone.slice(-4) });
  }
}
