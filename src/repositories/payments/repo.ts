import logger from "@/src/libs/logger"
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { find, findOne, insert, update, queryTransactionWrapper, executeTransactionWrapper } from '@/src/libs/db';
import { CountResult } from '@/src/interfaces/db';
import { OrderStatusE, OrderTypeE } from "@/src/interfaces/payment";

const msgGlobal = "REPO PAYMENTS "

export interface DBPaymentRow extends RowDataPacket {
    id: number;
    user_id: number;
    amount: number;
    ptype: OrderTypeE;
    question_id: number | null;
    alpha_id: string;
    status: OrderStatusE;
    data: string | null;
    created_at: string;
    question_uuid: string | null;
}

export async function getUserPayments(
    userId: string | number, page: number = 1, limit: number = 10
): Promise<DBPaymentRow[]> {
    const msg = msgGlobal + "getUserPayments - "
    const offset = (Math.max(page, 1) - 1) * limit
    const query = `SELECT po.id, po.user_id, po.amount, po.order_type ptype, po.question_id,
        po.alpha_id, po.status, po.data, po.created_at, BIN_TO_UUID(q.uuid) question_uuid
        FROM porder po LEFT JOIN question q ON po.question_id = q.id
        WHERE po.user_id = ?
        ORDER BY po.created_at DESC, po.id DESC
        LIMIT ? OFFSET ?`
    const findFunc = find({ query, values: [userId, limit, offset] });
    const executedQueries = await queryTransactionWrapper<DBPaymentRow>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return []
    }
    const [[rows]] = executedQueries;
    return rows ?? []
}

export async function getAllUserPaymentsForAdmin(
    userId: string | number, cap: number = 500
): Promise<DBPaymentRow[]> {
    const msg = msgGlobal + "getAllUserPaymentsForAdmin - "
    const query = `SELECT po.id, po.user_id, po.amount, po.order_type ptype, po.question_id,
        po.alpha_id, po.status, po.data, po.created_at, BIN_TO_UUID(q.uuid) question_uuid
        FROM porder po LEFT JOIN question q ON po.question_id = q.id
        WHERE po.user_id = ?
        ORDER BY po.created_at DESC, po.id DESC
        LIMIT ?`
    const findFunc = find({ query, values: [userId, cap] });
    const executedQueries = await queryTransactionWrapper<DBPaymentRow>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return []
    }
    const [[rows]] = executedQueries;
    return rows ?? []
}

export async function getUserPaymentsCount(userId: string | number): Promise<number> {
    const msg = msgGlobal + "getUserPaymentsCount - "
    const query = `SELECT COUNT(po.id) as counter FROM porder po WHERE po.user_id = ?`
    const calcFunc = findOne({ query, values: [userId] });
    const executedQueries = await queryTransactionWrapper<CountResult>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? 0 : rows[0].counter
}

export interface DBRetryRow extends RowDataPacket {
    id: number;
    user_id: number;
    amount: number;
    ptype: OrderTypeE;
    alpha_id: string;
    alpha_status: number;
    status: OrderStatusE;
    data: string | null;
    retry_count: number;
    next_retry_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClaimRetryOpts {
    maxRetries: number;
    stuckDays: number;
    leaseMinutes: number;
}

export async function claimRetryablePayments(
    lockToken: string, batchSize: number, opts: ClaimRetryOpts
): Promise<DBRetryRow[]> {
    const msg = msgGlobal + "claimRetryablePayments - "
    const { maxRetries, stuckDays, leaseMinutes } = opts

    const claimQuery = `UPDATE porder
        SET retry_lock_token = ?, retry_locked_at = NOW()
        WHERE status = ?
          AND alpha_id <> ''
          AND retry_count < ?
          AND (retry_locked_at IS NULL OR retry_locked_at <= NOW() - INTERVAL ? MINUTE)
          AND (
                (next_retry_at IS NOT NULL AND next_retry_at <= NOW())
             OR (next_retry_at IS NULL AND created_at <= NOW() - INTERVAL ? DAY)
          )
        ORDER BY next_retry_at ASC, id ASC
        LIMIT ?`
    const claimValues = [
        lockToken,
        OrderStatusE.InProgress,
        maxRetries,
        leaseMinutes,
        stuckDays,
        batchSize,
    ]
    const claimFunc = update({ query: claimQuery, values: claimValues })
    const claimed = await executeTransactionWrapper<ResultSetHeader>([claimFunc], msg)
    if (!claimed) {
        logger.error(msg + "claim update failed", claimQuery)
        return []
    }
    const affected = claimed[0]?.[0]?.affectedRows ?? 0
    if (affected === 0) {
        return []
    }

    const selectQuery = `SELECT id, user_id, amount, order_type ptype, alpha_id, alpha_status, status, data,
        retry_count, next_retry_at, created_at, updated_at
        FROM porder WHERE retry_lock_token = ?`
    const findFunc = find({ query: selectQuery, values: [lockToken] })
    const executed = await queryTransactionWrapper<DBRetryRow>([findFunc], msg)
    if (!executed) {
        logger.error(msg + "select claimed failed", selectQuery)
        return []
    }
    const [[rows]] = executed
    return rows ?? []
}

export interface RetryOutcome {
    orderId: number;
    lockToken: string;
    attempt: number;
    method: string;
    success: boolean;
    statusBefore: OrderStatusE;
    statusAfter: OrderStatusE;
    alphaStatus: number | null;
    retryCount: number;
    nextRetryMinutes: number | null;
    message: string | null;
}

export async function recordRetryOutcome(outcome: RetryOutcome): Promise<boolean> {
    const msg = msgGlobal + "recordRetryOutcome - "
    const nextExpr = outcome.nextRetryMinutes === null ? "NULL" : "NOW() + INTERVAL ? MINUTE"

    const updateQuery = `UPDATE porder
        SET retry_count = ?, status = ?, last_retry_at = NOW(), next_retry_at = ${nextExpr},
            retry_locked_at = NULL, retry_lock_token = NULL, updated_at = NOW()
        WHERE id = ? AND retry_lock_token = ?`
    const updateValues: (number | string | null)[] = [outcome.retryCount, outcome.statusAfter]
    if (outcome.nextRetryMinutes !== null) {
        updateValues.push(outcome.nextRetryMinutes)
    }
    updateValues.push(outcome.orderId, outcome.lockToken)

    const updateFunc = update({ query: updateQuery, values: updateValues })
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executed) {
        logger.error(msg + "porder bookkeeping failed", { order_id: outcome.orderId })
        return false
    }
    const affected = executed[0]?.[0]?.affectedRows ?? 0
    if (affected === 0) {
        logger.warn(msg + "lease lost, skipping bookkeeping", { order_id: outcome.orderId, token: outcome.lockToken })
        return false
    }

    const logQuery = `INSERT INTO payment_retry_log
        (order_id, attempt, method, success, status_before, status_after, alpha_status, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    const logValues = [
        outcome.orderId, outcome.attempt, outcome.method, outcome.success ? 1 : 0,
        outcome.statusBefore, outcome.statusAfter, outcome.alphaStatus,
        outcome.message ? outcome.message.slice(0, 500) : null,
    ]
    const logFunc = insert({ query: logQuery, values: logValues })
    const logged = await executeTransactionWrapper<ResultSetHeader>([logFunc], msg)
    if (!logged) {
        logger.error(msg + "retry log insert failed", { order_id: outcome.orderId })
    }
    return true
}

export async function getUserTotalSpent(userId: string | number): Promise<number> {
    const msg = msgGlobal + "getUserTotalSpent - "
    const query = `SELECT COALESCE(SUM(
            CASE WHEN po.order_type = ${OrderTypeE.Balance} THEN po.amount / 100 ELSE po.amount END
        ), 0) as total
        FROM porder po
        WHERE po.user_id = ?
          AND po.status = ${OrderStatusE.Paid}
          AND NOT (po.order_type = ${OrderTypeE.OneTime} AND (po.alpha_id = '' OR po.alpha_id IS NULL))`
    const calcFunc = findOne({ query, values: [userId] });
    const executedQueries = await queryTransactionWrapper<RowDataPacket>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? 0 : Number(rows[0].total) || 0
}

export async function getUserTotalExpenses(userId: string | number): Promise<number> {
    const msg = msgGlobal + "getUserTotalExpenses - "
    const query = `SELECT COALESCE(SUM(po.amount), 0) as total
        FROM porder po
        WHERE po.user_id = ?
          AND po.status = ${OrderStatusE.Paid}
          AND po.order_type = ${OrderTypeE.OneTime}`
    const calcFunc = findOne({ query, values: [userId] });
    const executedQueries = await queryTransactionWrapper<RowDataPacket>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? 0 : Number(rows[0].total) || 0
}

export async function getUserTotalTopups(userId: string | number): Promise<number> {
    const msg = msgGlobal + "getUserTotalTopups - "
    const query = `SELECT COALESCE(SUM(po.amount / 100), 0) as total
        FROM porder po
        WHERE po.user_id = ?
          AND po.status = ${OrderStatusE.Paid}
          AND po.order_type = ${OrderTypeE.Balance}`
    const calcFunc = findOne({ query, values: [userId] });
    const executedQueries = await queryTransactionWrapper<RowDataPacket>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? 0 : Number(rows[0].total) || 0
}
