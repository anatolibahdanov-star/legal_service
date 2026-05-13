import { ResultSetHeader } from 'mysql2/promise';
import { remove, executeTransactionWrapper } from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { pruneExpiredOtp } from '@/src/libs/otpStore';

const STALE_RETENTION_DAYS = 30;

/**
 * Deletes "stale" rows from anti-bruteforce DB tables:
 *  - otp_attempts.updated_at < NOW() - STALE_RETENTION_DAYS
 *  - login_attempts.updated_at < NOW() - STALE_RETENTION_DAYS
 *
 * Housekeeping — functionally, lazy-reset in the repo already zeroes the counters
 * on the next failed attempt. Here we just clean up old records for users
 * who never came back after an error.
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
 * Deletes expired OTP codes and verify tokens from the in-memory store.
 * Lazy cleanup on verify also works, but the Map grows between requests
 * for phones that received a code and never came back to verify.
 */
export const cleanupOtpStoreMemory = (): void => {
  const msg = 'CRON cleanupOtpStoreMemory - ';
  const { otpDeleted, tokenDeleted } = pruneExpiredOtp();
  if (otpDeleted > 0 || tokenDeleted > 0) {
    logger.info(msg + 'pruned', { otp_deleted: otpDeleted, token_deleted: tokenDeleted });
  }
};
