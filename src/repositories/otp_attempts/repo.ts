import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { findOne, insert, executeTransactionWrapper } from '@/src/libs/db';
import logger from '@/src/libs/logger';

const msgGlobal = 'REPO OTP_ATTEMPTS ';

// По ENKI-21: 1, 2, 4 попытки → ошибка; 3 попытка → cooldown 5 мин; 5 попытка → lock 24ч.
export const COOLDOWN_TRIGGER_ATTEMPTS = 3;
export const LOCKOUT_TRIGGER_ATTEMPTS = 5;
export const COOLDOWN_DURATION_MS = 5 * 60 * 1000;
export const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;

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

  // Если 24-часовой lock истёк — счётчик и cooldown сбрасываются (наказание отбыто).
  // Cooldown 5min сам по себе НЕ ресетит счётчик: после ожидания юзер продолжает
  // с того места, где был, и на 5-й неверной попытке получает 24ч lock.
  const baseAttempts = lockExpired ? 0 : existing?.attempts ?? 0;
  const nextAttempts = baseAttempts + 1;

  let action: FailAction = 'continue';
  let cooldownUntil: Date | null = lockExpired ? null : existing?.cooldown_until ?? null;
  let lockedUntil: Date | null = lockExpired ? null : prevLockedUntil;

  if (nextAttempts >= LOCKOUT_TRIGGER_ATTEMPTS) {
    action = 'lock_24h';
    lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    cooldownUntil = null;
  } else if (nextAttempts === COOLDOWN_TRIGGER_ATTEMPTS) {
    action = 'cooldown_5min';
    cooldownUntil = new Date(now.getTime() + COOLDOWN_DURATION_MS);
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
  return { attempts: nextAttempts, action, cooldownUntil, lockedUntil };
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
