import logger from '@/src/libs/logger';

const DEFAULT_PRICE_RUB = 450;

/**
 * Single source of truth for the per-question price.
 * Backed by the QUESTION_PRICE_RUB env var; falls back to a safe default
 * so we never serve 0 ₽ if the env is missing.
 *
 * Returned in whole rubles (the existing balance/order code also stores
 * rubles, not kopecks).
 */
export function getQuestionPrice(): number {
  const raw = process.env.QUESTION_PRICE_RUB;
  if (!raw) {
    logger.warn('QUESTION_PRICE_RUB env not set — falling back to default', {
      default: DEFAULT_PRICE_RUB,
    });
    return DEFAULT_PRICE_RUB;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    logger.warn('QUESTION_PRICE_RUB env is not a positive number', { raw });
    return DEFAULT_PRICE_RUB;
  }
  return n;
}
