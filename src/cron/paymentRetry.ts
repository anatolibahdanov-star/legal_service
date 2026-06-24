import { randomUUID } from "crypto";
import logger from "@/src/libs/logger";
import { claimRetryablePayments } from "@/src/repositories/payments/repo";
import {
    processRetryablePayment,
    RETRY_BATCH_SIZE,
    MAX_RETRIES,
    STUCK_AFTER_DAYS,
    LOCK_LEASE_MINUTES,
} from "@/src/services/paymentRetry";

let isRunning = false;

export const paymentRetry = async (): Promise<void> => {
    const msg = "CRON paymentRetry - ";

    if (isRunning) {
        logger.info(msg + "previous run still in progress, skipping");
        return;
    }
    isRunning = true;

    try {
        const lockToken = randomUUID();

        let claimed;
        try {
            claimed = await claimRetryablePayments(lockToken, RETRY_BATCH_SIZE, {
                maxRetries: MAX_RETRIES,
                stuckDays: STUCK_AFTER_DAYS,
                leaseMinutes: LOCK_LEASE_MINUTES,
            });
        } catch (err) {
            logger.error(msg + "claim failed", (err as Error).message);
            return;
        }

        if (claimed.length === 0) {
            logger.info(msg + "nothing to retry");
            return;
        }

        logger.info(msg + "claimed batch", { count: claimed.length, token: lockToken });

        let recovered = 0;
        for (const row of claimed) {
            try {
                const ok = await processRetryablePayment(row, lockToken);
                if (ok) recovered++;
            } catch (err) {
                logger.error(msg + "process failed", { order_id: row.id, err: (err as Error).message });
            }
        }

        logger.info(msg + "done", { processed: claimed.length, recovered });
    } finally {
        isRunning = false;
    }
};
