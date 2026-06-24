import { User } from "next-auth";
import logger from "@/src/libs/logger";
import { OrderStatusE } from "@/src/interfaces/payment";
import { checkOrderStatus } from "./order";
import { detectPaymentMethod } from "./paymentHistory";
import { DBRetryRow, recordRetryOutcome } from "@/src/repositories/payments/repo";

export const RETRY_INTERVALS_MINUTES = [5, 30];
export const MAX_RETRIES = RETRY_INTERVALS_MINUTES.length + 1;
export const STUCK_AFTER_DAYS = 3;
export const LOCK_LEASE_MINUTES = 10;
export const RETRY_BATCH_SIZE = 50;

const msgGlobal = "SERVICE PAYMENT-RETRY ";

const buildCronUser = (userId: number): User => ({ id: String(userId) }) as User;

export const processRetryablePayment = async (row: DBRetryRow, lockToken: string): Promise<boolean> => {
    const msg = msgGlobal + "processRetryablePayment - ";
    const statusBefore = row.status;
    const attempt = row.retry_count + 1;

    let statusAfter: OrderStatusE = statusBefore;
    let alphaStatus: number | null = row.alpha_status;
    let resultData: string | null = row.data;
    let message: string | null = null;
    let polled = false;

    try {
        const result = await checkOrderStatus(row.alpha_id, buildCronUser(row.user_id));
        if (result.order) {
            polled = true;
            statusAfter = result.order.status;
            alphaStatus = result.order.alpha_status;
            resultData = result.order.data ?? row.data;
        } else {
            message = (result.errors ?? []).join("; ") || "gateway unreachable";
        }
    } catch (err) {
        message = (err as Error).message;
        logger.error(msg + "attempt threw", { order_id: row.id, err: message });
    }

    const method = detectPaymentMethod(row.ptype, row.alpha_id, resultData);
    const success = statusAfter === OrderStatusE.Paid;

    let retryCount = row.retry_count;
    let nextRetryMinutes: number | null = null;
    let finalStatus: OrderStatusE = statusAfter;

    if (success) {
        finalStatus = OrderStatusE.Paid;
    } else if (!polled) {
        nextRetryMinutes = RETRY_INTERVALS_MINUTES[0];
        finalStatus = statusBefore;
    } else if (statusAfter !== OrderStatusE.InProgress) {
        retryCount = attempt;
    } else {
        retryCount = attempt;
        if (retryCount >= MAX_RETRIES) {
            finalStatus = OrderStatusE.FinalFailed;
        } else {
            nextRetryMinutes = RETRY_INTERVALS_MINUTES[retryCount - 1];
        }
    }

    const owned = await recordRetryOutcome({
        orderId: row.id,
        lockToken,
        attempt,
        method,
        success,
        statusBefore,
        statusAfter: finalStatus,
        alphaStatus,
        retryCount,
        nextRetryMinutes,
        message,
    });

    logger.info(msg + "processed", {
        order_id: row.id,
        attempt,
        method,
        success,
        status_after: finalStatus,
        next_retry_minutes: nextRetryMinutes,
        polled,
        owned,
    });

    return success && owned;
};
