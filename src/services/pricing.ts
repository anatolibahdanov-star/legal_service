import logger from '@/src/libs/logger';
import { getSettingNumber, reloadSettings } from '@/src/services/settings';

const DEFAULT_PRICE_RUB = 4.5;
const DEFAULT_PRICE_RUB_LK = 3;

export type QuestionSource = 'lk' | 'main';

function readPositiveEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    logger.warn(`${name} env is not a positive number`, { raw });
    return fallback;
  }
  return n;
}

export function getFixedFee(): number {
  return Math.max(0, getSettingNumber('fixed_fee_rub', 0));
}

// Returns rubles, with the fixed service fee already added on (effective charge).
export function getQuestionPrice(): number {
  const base = getSettingNumber('question_price_main', readPositiveEnv('QUESTION_PRICE_RUB', DEFAULT_PRICE_RUB));
  return base + getFixedFee();
}

export function getQuestionPriceLK(): number {
  const base = getSettingNumber('question_price_lk', readPositiveEnv('QUESTION_PRICE_RUB_LK', DEFAULT_PRICE_RUB_LK));
  return base + getFixedFee();
}

/** Dispatches to the right price helper based on where the wizard runs. */
export function getQuestionPriceFor(source: QuestionSource): number {
  return source === 'lk' ? getQuestionPriceLK() : getQuestionPrice();
}

// Money-critical reads (price shown and charged to the user). These force a
// settings refresh from the DB first, so a price changed in the admin panel
// applies immediately instead of waiting out the in-memory cache TTL.
export async function getQuestionPriceLKFresh(): Promise<number> {
  await reloadSettings();
  return getQuestionPriceLK();
}

export async function getQuestionPriceForFresh(source: QuestionSource): Promise<number> {
  await reloadSettings();
  return getQuestionPriceFor(source);
}
