import { parsePhoneNumberFromString } from 'libphonenumber-js';

const PHONE_EMAIL_DOMAIN = 'phone.local';

export interface NormalizedPhone {
  e164: string;
  digits: string;
}

export const normalizePhoneE164 = (raw: string): NormalizedPhone | null => {
  const trimmed = raw.trim();
  let parsed = parsePhoneNumberFromString(trimmed, 'RU');
  if (!parsed?.isValid()) {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return null;
    parsed = parsePhoneNumberFromString(`+${digits}`);
  }
  if (!parsed?.isValid()) return null;
  return { e164: parsed.number, digits: parsed.number.replace(/^\+/, '') };
};

export const phoneToEmail = (e164: string): string => {
  const digits = e164.replace(/^\+/, '');
  return `${digits}@${PHONE_EMAIL_DOMAIN}`;
};

export const isPhoneEmail = (email: string | null | undefined): boolean =>
  !!email && email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);

export const phoneToDefaultName = (e164: string): string => {
  const digits = e164.replace(/^\+/, '');
  return `User ${digits.slice(-4)}`;
};

export const generatePassword = (): string =>
  `otp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;

/**
 * True when the user has no real email yet (missing or phone-placeholder).
 * Per spec the wizard's profile step is triggered solely by missing email;
 * name is optional and doesn't drive the conditional.
 *
 * Passing `null` user (no DB record at all) also returns true — the wizard
 * needs to collect their profile data.
 */
export const needsProfileCompletion = (
  user: { email?: string | null } | null | undefined,
): boolean => {
  if (!user) return true;
  if (!user.email) return true;
  if (isPhoneEmail(user.email)) return true;
  return false;
};
