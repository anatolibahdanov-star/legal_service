import logger from '@/src/libs/logger';

const OTP_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_TTL_MS = 20 * 60 * 1000;

interface OtpEntry {
  code: string;
  expiresAt: number;
  createdAt: number;
}

interface TokenEntry {
  token: string;
  expiresAt: number;
}

declare global {
  var __otpStore__: Map<string, OtpEntry> | undefined;
  var __otpTokens__: Map<string, TokenEntry> | undefined;
}

const otpStore: Map<string, OtpEntry> =
  globalThis.__otpStore__ ?? (globalThis.__otpStore__ = new Map());
const otpTokens: Map<string, TokenEntry> =
  globalThis.__otpTokens__ ?? (globalThis.__otpTokens__ = new Map());

const generateCode = (): string =>
  Math.floor(1000 + Math.random() * 9000).toString();

const generateToken = (): string =>
  `vt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;

export interface CreateOtpResult {
  ok: true;
  code: string;
  expiresInSec: number;
}

// A new code can be requested at any time. Writing a fresh entry overwrites the
// previous one, so the previously sent unused code becomes invalid immediately.
export const createOtp = (phone: string): CreateOtpResult => {
  const now = Date.now();
  const replaced = otpStore.has(phone);
  const code = generateCode();
  otpStore.set(phone, {
    code,
    expiresAt: now + OTP_TTL_MS,
    createdAt: now,
  });
  logger.info('OTP store - created', {
    phone_tail: phone.slice(-4),
    expires_in_sec: OTP_TTL_MS / 1000,
    replaced_previous: replaced,
  });
  return { ok: true, code, expiresInSec: OTP_TTL_MS / 1000 };
};

export type VerifyOtpResult =
  | { ok: true; verifyToken: string }
  | { ok: false; reason: 'not_found' | 'expired' | 'invalid' };

export const verifyOtp = (phone: string, code: string): VerifyOtpResult => {
  const entry = otpStore.get(phone);
  if (!entry) return { ok: false, reason: 'not_found' };
  const now = Date.now();
  if (now > entry.expiresAt) {
    otpStore.delete(phone);
    return { ok: false, reason: 'expired' };
  }
  if (entry.code !== code) {
    return { ok: false, reason: 'invalid' };
  }

  otpStore.delete(phone);
  const token = generateToken();
  otpTokens.set(phone, { token, expiresAt: now + TOKEN_TTL_MS });
  logger.info('OTP store - verified', { phone_tail: phone.slice(-4) });
  return { ok: true, verifyToken: token };
};

export const invalidateOtp = (phone: string): void => {
  otpStore.delete(phone);
};

export const consumeVerifyToken = (phone: string, token: string): boolean => {
  const entry = otpTokens.get(phone);
  if (!entry) return false;
  const now = Date.now();
  if (now > entry.expiresAt || entry.token !== token) {
    if (now > entry.expiresAt) otpTokens.delete(phone);
    return false;
  }
  otpTokens.delete(phone);
  return true;
};

/**
 * Validates a verify token WITHOUT consuming it.
 * Used by the question wizard, where the same token may be presented multiple
 * times (verify → profile save → signIn) before finally being consumed.
 */
export const peekVerifyToken = (phone: string, token: string): boolean => {
  const entry = otpTokens.get(phone);
  if (!entry) return false;
  const now = Date.now();
  if (now > entry.expiresAt) {
    otpTokens.delete(phone);
    return false;
  }
  return entry.token === token;
};

export const pruneExpiredOtp = (): { otpDeleted: number; tokenDeleted: number } => {
  const now = Date.now();
  let otpDeleted = 0;
  let tokenDeleted = 0;
  for (const [phone, entry] of otpStore) {
    if (entry.expiresAt <= now) {
      otpStore.delete(phone);
      otpDeleted += 1;
    }
  }
  for (const [phone, entry] of otpTokens) {
    if (entry.expiresAt <= now) {
      otpTokens.delete(phone);
      tokenDeleted += 1;
    }
  }
  return { otpDeleted, tokenDeleted };
};
