import logger from "@/src/libs/logger"
import {insert, executeTransactionWrapper, update} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import { BalanceTransactionI, BalanceStatusE, BalanceTypeE } from "@/src/interfaces/payment";

const msgGlobal = "REPO BALANCE "

export interface ChargeResult {
  /** True when the debit succeeded — user had enough funds and update went through. */
  ok: boolean;
  /** Reason on failure: 'insufficient' (balance too low) or 'db_error'. */
  reason?: 'insufficient' | 'db_error';
  /** Inserted balance-row id, on success. */
  transactionId?: number;
}

/**
 * Atomically charges the user's balance by `amount` rubles.
 * Uses a conditional UPDATE (`balance >= ?`) so concurrent calls can't push
 * the balance below zero. On successful deduction, records a Decrease row
 * in the balance table linked to the given order_id.
 *
 * `amount` must be a positive number (this is a debit, not a transfer).
 */
export async function chargeUserBalance(
    userId: number | string,
    amount: number,
    orderId: number | null,
): Promise<ChargeResult> {
    const msg = msgGlobal + 'chargeUserBalance - ';
    if (!Number.isFinite(amount) || amount <= 0) {
        logger.error(msg + 'invalid amount', { user_id: userId, amount });
        return { ok: false, reason: 'db_error' };
    }

    // Step 1 — atomic deduct guarded by balance >= amount.
    const deductSQL = `UPDATE user SET balance = balance - ? WHERE id = ? AND balance >= ?`;
    const deductParams = [amount, userId, amount];
    const deductFunc = update({ query: deductSQL, values: deductParams });
    const deductExec = await executeTransactionWrapper<ResultSetHeader>([deductFunc], msg);
    if (!deductExec) {
        logger.error(msg + 'SQL failed on deduct', { user_id: userId, amount });
        return { ok: false, reason: 'db_error' };
    }
    const affected = deductExec[0]?.[0]?.affectedRows ?? 0;
    if (affected === 0) {
        logger.warn(msg + 'insufficient balance', { user_id: userId, amount });
        return { ok: false, reason: 'insufficient' };
    }

    // Step 2 — record the debit in the balance ledger (Decrease, negative amount
    // to match addBalanceTransaction's "balance = balance + amount" semantics
    // for any reporting that re-aggregates from this table).
    const insertSQL = `
        INSERT INTO balance(user_id, order_id, balance_type, amount, status, data, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const insertParams = [
        userId,
        orderId,
        BalanceTypeE.Decrease,
        -Math.abs(amount),
        BalanceStatusE.Success,
        null,
    ];
    const insertFunc = insert({ query: insertSQL, values: insertParams });
    const insertExec = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!insertExec) {
        logger.error(msg + 'SQL failed on ledger insert', { user_id: userId, amount });
        // Money has already been deducted; can't roll back cheaply here.
        // Surface as success since the user-visible state (balance decreased)
        // is correct; admins can reconcile from logs.
        return { ok: true };
    }
    const transactionId = insertExec[0]?.[0]?.insertId;
    logger.info(msg + 'debited', {
        user_id: userId,
        amount,
        order_id: orderId,
        ledger_id: transactionId,
    });
    return { ok: true, transactionId };
}

export async function addBalance(trans: BalanceTransactionI): Promise<boolean | null> {
    const msg = msgGlobal + "addBalance - "
    trans.data = trans.data ? JSON.stringify(trans.data) : null;
    const query = `INSERT INTO 
        balance(user_id, order_id, balance_type, amount, status, data, created_at, updated_at) 
        VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())`
    const params = [trans.user_id, trans.order_id, trans.balance_type, trans.amount, trans.status, trans.data];
    const insertFunc = insert({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [resultInsert] = executedQueries;
    const insertedId = resultInsert[0]?.insertId
    if (!insertedId) {
        logger.error(msg + "Empty inserted id", resultInsert[0])
        return null
    }
    return true
}

export async function addBalanceTransaction(trans: BalanceTransactionI): Promise<boolean | null> {
    const msg = msgGlobal + "addBalanceTransaction - "
    trans.data = trans.data ? JSON.stringify(trans.data) : null;

    const insertSQL = `
        INSERT INTO 
        balance(user_id, order_id, balance_type, amount, status, data, created_at, updated_at) 
        VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const insertData = [trans.user_id, trans.order_id, trans.balance_type, trans.amount, trans.status, trans.data]
    const insertFunc = insert({ query: insertSQL, values: insertData});
    const updateSQL = `UPDATE user SET balance=balance + ? WHERE id=?`;
    const updateData = [trans.amount, trans.user_id]
    const updatedFunc = update({ query: updateSQL, values: updateData});

    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc, updatedFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", insertSQL, updateSQL)
        return null
    }
    const [results] = executedQueries;
    logger.info(msg + "transaction results", results)

    return true
}
