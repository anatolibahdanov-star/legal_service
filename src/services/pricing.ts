import logger from '@/src/libs/logger';

const DEFAULT_PRICE_RUB = 4.5;
const DEFAULT_PRICE_RUB_LK = 3;

export type QuestionSource = 'lk' | 'main';

function readPositiveEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    logger.warn(`${name} env not set — falling back to default`, { default: fallback });
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    logger.warn(`${name} env is not a positive number`, { raw });
    return fallback;
  }
  return n;
}

/**
 * Per-question price for the main-page wizard flow (guest landing).
 * Backed by QUESTION_PRICE_RUB; default 4.5₽.
 * Возвращается в рублях (может быть дробной — например 4.5). Для Альфы
 * умножается на 100 в initNewOrder (OneTime). chargeUserBalance принимает
 * рубли и сам конвертит в копейки.
 */
export function getQuestionPrice(): number {
  return readPositiveEnv('QUESTION_PRICE_RUB', DEFAULT_PRICE_RUB);
}

/**
 * Per-question price when пользователь задаёт вопрос изнутри ЛК.
 * Backed by QUESTION_PRICE_RUB_LK; default 3₽.
 */
export function getQuestionPriceLK(): number {
  return readPositiveEnv('QUESTION_PRICE_RUB_LK', DEFAULT_PRICE_RUB_LK);
}

/** Dispatches to the right price helper based on where the wizard runs. */
export function getQuestionPriceFor(source: QuestionSource): number {
  return source === 'lk' ? getQuestionPriceLK() : getQuestionPrice();
}
