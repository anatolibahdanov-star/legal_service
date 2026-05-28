import { randomBytes } from 'node:crypto';

// 4-char base62 identifier used in /api/pdf/<id> URLs. ~14.7M unique values
// — small enough to be enumerable, so this is NOT a security/sharing token
// (use the per-question share link for that). It's just a short, friendly
// public alias for question.uuid.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const SHORT_ID_LENGTH = 4;
export const SHORT_ID_REGEX = /^[A-Za-z0-9]{4}$/;
/** Matches either the new 4-char short_id or the legacy 32-36-char UUID. */
export const PDF_ID_REGEX = /^([0-9a-fA-F-]{32,36}|[A-Za-z0-9]{4})$/;

export function generateShortId(): string {
  // Reject the modulo-biased low slice of each byte so the alphabet
  // distribution stays uniform. 252 = 4 * 63 ≥ 4 * 62, so any byte ≥ 252
  // is discarded — < 2% loss in expectation, irrelevant for 4 chars.
  const out: string[] = [];
  while (out.length < SHORT_ID_LENGTH) {
    const buf = randomBytes(SHORT_ID_LENGTH * 2);
    for (let i = 0; i < buf.length && out.length < SHORT_ID_LENGTH; i++) {
      const b = buf[i];
      if (b >= 252) continue;
      out.push(ALPHABET[b % ALPHABET.length]);
    }
  }
  return out.join('');
}

export function isShortId(value: string): boolean {
  return SHORT_ID_REGEX.test(value);
}
