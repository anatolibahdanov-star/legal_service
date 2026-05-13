import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { findOne, insert, executeTransactionWrapper } from '@/src/libs/db';
import logger from '@/src/libs/logger';

const msgGlobal = 'REPO LOGIN_ATTEMPTS ';

export const LOCKOUT_TRIGGER_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export interface DBLoginAttempts extends RowDataPacket {
  email: string;
  attempts: number;
  locked_until: Date | null;
  last_attempt_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type LoginFailAction = 'continue' | 'lock_15min';

export interface RecordLoginFailResult {
  attempts: number;
  action: LoginFailAction;
  lockedUntil: Date | null;
}

export interface LoginPhoneStatus {
  locked: boolean;
  lockedUntil: Date | null;
  lockedRemainingSec: number;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

async function getLoginAttempts(email: string): Promise<DBLoginAttempts | null> {
  const msg = msgGlobal + 'getLoginAttempts - ';
  const query = 'SELECT * FROM login_attempts WHERE email = ? LIMIT 1';
  const findFunc = findOne({ query, values: [email] });
  const executed = await executeTransactionWrapper<DBLoginAttempts[]>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no result from db');
    return null;
  }
  const [rows] = executed[0];
  return rows[0] ?? null;
}

export async function getLoginStatus(email: string): Promise<LoginPhoneStatus> {
  const row = await getLoginAttempts(normalizeEmail(email));
  const now = Date.now();
  const lockedTs = row?.locked_until ? new Date(row.locked_until).getTime() : 0;
  return {
    locked: lockedTs > now,
    lockedUntil: lockedTs > now ? new Date(lockedTs) : null,
    lockedRemainingSec: lockedTs > now ? Math.ceil((lockedTs - now) / 1000) : 0,
  };
}

export async function recordFailedLogin(email: string): Promise<RecordLoginFailResult> {
  const msg = msgGlobal + 'recordFailedLogin - ';
  const key = normalizeEmail(email);
  const now = new Date();

  const existing = await getLoginAttempts(key);
  const prevLockedUntil = existing?.locked_until ? new Date(existing.locked_until) : null;
  const lockExpired = prevLockedUntil !== null && prevLockedUntil.getTime() <= now.getTime();

  // 15-minute lock expired → counter starts from zero (user has "served their time").
  const baseAttempts = lockExpired ? 0 : existing?.attempts ?? 0;
  const nextAttempts = baseAttempts + 1;

  let action: LoginFailAction = 'continue';
  let lockedUntil: Date | null = lockExpired ? null : prevLockedUntil;
  if (nextAttempts > LOCKOUT_TRIGGER_ATTEMPTS) {
    action = 'lock_15min';
    lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
  }

  const upsertQuery = `
    INSERT INTO login_attempts (email, attempts, locked_until, last_attempt_at)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      attempts = VALUES(attempts),
      locked_until = VALUES(locked_until),
      last_attempt_at = VALUES(last_attempt_at)
  `;
  const insertFunc = insert({ query: upsertQuery, values: [key, nextAttempts, lockedUntil, now] });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'upsert failed');
  }

  logger.info(msg + 'recorded', { attempts: nextAttempts, action });
  return { attempts: nextAttempts, action, lockedUntil };
}

export async function resetLoginAttempts(email: string): Promise<void> {
  const msg = msgGlobal + 'resetLoginAttempts - ';
  const key = normalizeEmail(email);
  const query = `
    INSERT INTO login_attempts (email, attempts, locked_until, last_attempt_at)
    VALUES (?, 0, NULL, NULL)
    ON DUPLICATE KEY UPDATE
      attempts = 0,
      locked_until = NULL,
      last_attempt_at = NULL
  `;
  const insertFunc = insert({ query, values: [key] });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'reset failed');
  }
}
