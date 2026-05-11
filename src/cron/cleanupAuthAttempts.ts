import { ResultSetHeader } from 'mysql2/promise';
import { remove, executeTransactionWrapper } from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { pruneExpiredOtp } from '@/src/libs/otpStore';

const STALE_RETENTION_DAYS = 30;

/**
 * Удаляет «устаревшие» строки из БД-таблиц anti-bruteforce-счётчиков:
 *  - otp_attempts.updated_at < NOW() - STALE_RETENTION_DAYS
 *  - login_attempts.updated_at < NOW() - STALE_RETENTION_DAYS
 *
 * Это housekeeping — функционально lazy-reset в repo уже обнуляет счётчики
 * при следующем неудачном вводе. Здесь просто чистим старые записи юзеров,
 * которые после ошибки больше никогда не возвращались.
 */
export const cleanupAuthAttemptsDb = async (): Promise<void> => {
  const msg = 'CRON cleanupAuthAttemptsDb - ';

  const otpQuery = `DELETE FROM otp_attempts WHERE updated_at < NOW() - INTERVAL ? DAY`;
  const loginQuery = `DELETE FROM login_attempts WHERE updated_at < NOW() - INTERVAL ? DAY`;

  const otpFunc = remove({ query: otpQuery, values: [STALE_RETENTION_DAYS] });
  const loginFunc = remove({ query: loginQuery, values: [STALE_RETENTION_DAYS] });

  const executed = await executeTransactionWrapper<ResultSetHeader>(
    [otpFunc, loginFunc],
    msg,
  );
  if (!executed) {
    logger.error(msg + 'transaction failed');
    return;
  }
  const [[otpResult], [loginResult]] = executed;
  logger.info(msg + 'done', {
    retention_days: STALE_RETENTION_DAYS,
    otp_attempts_deleted: otpResult.affectedRows,
    login_attempts_deleted: loginResult.affectedRows,
  });
};

/**
 * Удаляет истёкшие OTP-коды и verify-токены из in-memory store.
 * Lazy-cleanup при verify тоже работает, но Map растёт между обращениями
 * для номеров, которые получили код и не вернулись верифицировать.
 */
export const cleanupOtpStoreMemory = (): void => {
  const msg = 'CRON cleanupOtpStoreMemory - ';
  const { otpDeleted, tokenDeleted } = pruneExpiredOtp();
  if (otpDeleted > 0 || tokenDeleted > 0) {
    logger.info(msg + 'pruned', { otp_deleted: otpDeleted, token_deleted: tokenDeleted });
  }
};
