const BALANCE_REFRESH_EVENT = "user-balance:refresh";

/**
 * Notifies all mounted balance widgets to re-fetch their value.
 * Call this on the client after any action that changes the user's
 * balance (top-up confirmation, pay-with-balance, refund, etc).
 */
export function emitBalanceRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BALANCE_REFRESH_EVENT));
}

export function subscribeBalanceRefresh(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(BALANCE_REFRESH_EVENT, handler);
  return () => window.removeEventListener(BALANCE_REFRESH_EVENT, handler);
}
