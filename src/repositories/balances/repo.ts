import logger from "@/src/libs/logger"
import pool, {find, insert, executeTransactionWrapper, queryTransactionWrapper} from '@/src/libs/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { BalanceTransactionI, BalanceStatusE, BalanceTypeE } from "@/src/interfaces/payment";

const msgGlobal = "REPO BALANCE "

export interface DBManualBalanceRow extends RowDataPacket {
    id: number;
    balance_type: BalanceTypeE;
    amount: number;
    comment: string | null;
    created_at: string;
    admin_id: number | null;
    admin_name: string | null;
    admin_username: string | null;
}

/**
 * Manual balance adjustments made by an admin (e.g. support compensation).
 * Recorded as a `balance` ledger row with order_id NULL plus an atomic bump
 * of user.balance. `amountKop` is signed (positive = top-up, negative = debit)
 * and must already be in kopecks — same convention as the rest of the table.
 */
export async function adminAdjustBalance(
    userId: number | string,
    amountKop: number,
    adminId: number | null,
    comment: string,
): Promise<{ ok: boolean; transactionId?: number }> {
    const msg = msgGlobal + 'adminAdjustBalance - ';
    if (!Number.isFinite(amountKop) || amountKop === 0) {
        logger.error(msg + 'invalid amount', { user_id: userId, amountKop });
        return { ok: false };
    }
    const balanceType = amountKop > 0 ? BalanceTypeE.Increase : BalanceTypeE.Decrease;
    const insertSQL = `
        INSERT INTO balance(user_id, admin_id, order_id, balance_type, amount, status, data, comment, created_at, updated_at)
        VALUES(?, ?, NULL, ?, ?, ?, NULL, ?, NOW(), NOW())
    `;
    const insertParams = [userId, adminId, balanceType, amountKop, BalanceStatusE.Success, comment];
    const updateSQL = `UPDATE user SET balance = balance + ? WHERE id = ?`;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [insRes] = await conn.query<ResultSetHeader>(insertSQL, insertParams);
        await conn.query<ResultSetHeader>(updateSQL, [amountKop, userId]);
        await conn.commit();
        const transactionId = insRes.insertId;
        logger.info(msg + 'adjusted', { user_id: userId, amountKop, admin_id: adminId, ledger_id: transactionId });
        return { ok: true, transactionId };
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { user_id: userId, amountKop, error });
        return { ok: false };
    } finally {
        conn.release();
    }
}

/**
 * Ledger rows that are NOT tied to a porder (order_id IS NULL) — i.e. manual
 * admin adjustments and refunds. Joined with the administrator who made the
 * change so the admin panel can render "Кто изменил".
 */
export async function getUserManualOperations(userId: number | string, cap: number = 2000): Promise<DBManualBalanceRow[]> {
    const msg = msgGlobal + 'getUserManualOperations - ';
    const query = `SELECT b.id, b.balance_type, b.amount, b.comment, b.created_at, b.admin_id,
        a.name admin_name, a.username admin_username
        FROM balance b
        LEFT JOIN administrator a ON b.admin_id = a.id
        WHERE b.user_id = ? AND b.order_id IS NULL
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT ?`;
    const findFunc = find({ query, values: [userId, cap] });
    const executedQueries = await queryTransactionWrapper<DBManualBalanceRow>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + 'SQL not results from execution', query);
        return [];
    }
    const [[rows]] = executedQueries;
    return rows ?? [];
}

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
 *
 * Внутри БД `user.balance` хранится в копейках (SELECT-ы по таблице делят
 * на 100). Снаружи же все операции работают в рублях, поэтому здесь
 * конвертируем рубли → копейки прямо на границе записи.
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
    const amountKop = Math.round(amount * 100);

    const deductSQL = `UPDATE user SET balance = balance - ? WHERE id = ? AND balance >= ?`;
    const deductParams = [amountKop, userId, amountKop];
    const insertSQL = `
        INSERT INTO balance(user_id, order_id, balance_type, amount, status, data, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const insertParams = [
        userId,
        orderId,
        BalanceTypeE.Decrease,
        -Math.abs(amountKop),
        BalanceStatusE.Success,
        null,
    ];

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [deductRes] = await conn.query<ResultSetHeader>(deductSQL, deductParams);
        const affected = deductRes.affectedRows ?? 0;
        if (affected === 0) {
            await conn.rollback();
            logger.warn(msg + 'insufficient balance', { user_id: userId, amount });
            return { ok: false, reason: 'insufficient' };
        }
        const [insRes] = await conn.query<ResultSetHeader>(insertSQL, insertParams);
        await conn.commit();
        const transactionId = insRes.insertId;
        logger.info(msg + 'debited', { user_id: userId, amount, order_id: orderId, ledger_id: transactionId });
        return { ok: true, transactionId };
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { user_id: userId, amount, error });
        return { ok: false, reason: 'db_error' };
    } finally {
        conn.release();
    }
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
    const updateSQL = `UPDATE user SET balance=balance + ? WHERE id=?`;
    const updateData = [trans.amount, trans.user_id]

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query<ResultSetHeader>(insertSQL, insertData);
        await conn.query<ResultSetHeader>(updateSQL, updateData);
        await conn.commit();
        return true
    } catch (error) {
        await conn.rollback();
        logger.error(msg + "transaction failed", error)
        return null
    } finally {
        conn.release();
    }
}
