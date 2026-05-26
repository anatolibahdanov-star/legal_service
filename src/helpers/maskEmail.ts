/**
 * Masks an email address for display on password-recovery success screens.
 *
 * Rules (per ENKI spec):
 *   - keep the first 4 characters of the local part
 *   - keep the first and last character of the domain (before TLD)
 *   - replace the rest with asterisks
 *   - keep the original TLD untouched
 *
 * Examples:
 *   ivan.ivanov@gmail.com  -> ivan******@g***l.com
 *   ab@x.io                -> ab*@x.io
 *   john@a.co              -> john@a.co
 */
export const maskEmail = (raw: string): string => {
  const trimmed = (raw ?? "").trim();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const localKeep = local.slice(0, 4);
  const localTail = local.length > 4 ? "*".repeat(Math.max(1, local.length - 4)) : "";
  const maskedLocal = localKeep + localTail;

  const dot = domain.lastIndexOf(".");
  if (dot <= 0) {
    // no TLD — apply the same first/last rule to the whole domain
    if (domain.length <= 2) return `${maskedLocal}@${domain}`;
    return `${maskedLocal}@${domain[0]}${"*".repeat(domain.length - 2)}${domain[domain.length - 1]}`;
  }

  const domainName = domain.slice(0, dot);
  const tld = domain.slice(dot); // includes the leading dot
  let maskedDomain: string;
  if (domainName.length <= 2) {
    maskedDomain = domainName;
  } else {
    maskedDomain =
      domainName[0] + "*".repeat(domainName.length - 2) + domainName[domainName.length - 1];
  }
  return `${maskedLocal}@${maskedDomain}${tld}`;
};
