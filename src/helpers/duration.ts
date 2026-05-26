/**
 * Human-friendly Russian rendering of a wait duration ("23 ч 50 мин",
 * "5 мин", "30 с"). Used in user-facing messages where raw seconds would
 * be unreadable (the 24h OTP resend cooldown gives ~86 400 s otherwise).
 */
export const formatRetryAfter = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "несколько секунд";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  if (m > 0) return `${m} мин`;
  return `${s} с`;
};
