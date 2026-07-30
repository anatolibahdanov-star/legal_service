import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { FreeQuestionOpTypeE, FreeQuestionSourceE } from '@/src/interfaces/payment';

const msgGlobal = 'REPO FQ-GRANT ';

interface GrantLotRow extends RowDataPacket {
    id: number;
    user_id: number;
    remaining: number;
    source: number;
}

export async function accrueSubscriptionGrantTx(
    conn: PoolConnection,
    userId: number | string,
    count: number,
    subscriptionId: number,
    expiresAt: string,
): Promise<number> {
    const [grantRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO free_question_grant(user_id, source, remaining, initial, expires_at, subscription_id, created_at)
         VALUES(?, ?, ?, ?, ?, ?, NOW())`,
        [userId, FreeQuestionSourceE.Subscription, count, count, expiresAt, subscriptionId],
    );
    const grantId = grantRes.insertId;
    await conn.query<ResultSetHeader>(
        `INSERT INTO free_question_operation(user_id, admin_id, question_id, op_type, source, grant_id, amount, comment, created_at)
         VALUES(?, NULL, NULL, ?, ?, ?, ?, ?, NOW())`,
        [userId, FreeQuestionOpTypeE.SubscriptionAccrual, FreeQuestionSourceE.Subscription, grantId, count, 'Начисление БВ по подписке'],
    );
    await conn.query<ResultSetHeader>(`UPDATE user SET free_questions = free_questions + ? WHERE id = ?`, [count, userId]);
    return grantId;
}

export async function topUpSubscriptionGrantTx(
    conn: PoolConnection,
    grantId: number,
    userId: number | string,
    addCount: number,
    newExpiresAt: string,
    comment: string = 'Продление подписки',
): Promise<void> {
    await conn.query<ResultSetHeader>(
        `UPDATE free_question_grant SET initial = remaining + ?, remaining = remaining + ?, expires_at = ? WHERE id = ?`,
        [addCount, addCount, newExpiresAt, grantId],
    );
    if (addCount > 0) {
        await conn.query<ResultSetHeader>(
            `INSERT INTO free_question_operation(user_id, admin_id, question_id, op_type, source, grant_id, amount, comment, created_at)
             VALUES(?, NULL, NULL, ?, ?, ?, ?, ?, NOW())`,
            [userId, FreeQuestionOpTypeE.SubscriptionAccrual, FreeQuestionSourceE.Subscription, grantId, addCount, comment],
        );
        await conn.query<ResultSetHeader>(`UPDATE user SET free_questions = free_questions + ? WHERE id = ?`, [addCount, userId]);
    }
}

export async function debitSubscriptionGrantsTx(
    conn: PoolConnection,
    userId: number | string,
    count: number,
    comment: string,
): Promise<number> {
    if (count <= 0) return 0;
    const [lots] = await conn.query<GrantLotRow[]>(
        `SELECT id, remaining FROM free_question_grant
         WHERE user_id = ? AND source = ? AND remaining > 0 AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY expires_at ASC, id ASC
         FOR UPDATE`,
        [userId, FreeQuestionSourceE.Subscription],
    );
    let need = count;
    let taken = 0;
    for (const lot of lots) {
        if (need <= 0) break;
        const take = Math.min(need, lot.remaining);
        await conn.query<ResultSetHeader>(`UPDATE free_question_grant SET remaining = remaining - ? WHERE id = ?`, [take, lot.id]);
        need -= take;
        taken += take;
    }
    if (taken > 0) {
        await conn.query<ResultSetHeader>(`UPDATE user SET free_questions = GREATEST(free_questions - ?, 0) WHERE id = ?`, [taken, userId]);
        await conn.query<ResultSetHeader>(
            `INSERT INTO free_question_operation(user_id, admin_id, question_id, op_type, source, grant_id, amount, comment, created_at)
             VALUES(?, NULL, NULL, ?, ?, NULL, ?, ?, NOW())`,
            [userId, FreeQuestionOpTypeE.Charge, FreeQuestionSourceE.Subscription, taken, comment],
        );
    }
    return taken;
}

export async function expireSubscriptionGrantTx(conn: PoolConnection, grantId: number): Promise<number> {
    const [rows] = await conn.query<GrantLotRow[]>(
        `SELECT id, user_id, remaining FROM free_question_grant
         WHERE id = ? AND source = ? AND remaining > 0
         FOR UPDATE`,
        [grantId, FreeQuestionSourceE.Subscription],
    );
    if (rows.length === 0) return 0;
    const { user_id, remaining } = rows[0];
    await conn.query<ResultSetHeader>(`UPDATE free_question_grant SET remaining = 0 WHERE id = ?`, [grantId]);
    await conn.query<ResultSetHeader>(`UPDATE user SET free_questions = GREATEST(free_questions - ?, 0) WHERE id = ?`, [remaining, user_id]);
    await conn.query<ResultSetHeader>(
        `INSERT INTO free_question_operation(user_id, admin_id, question_id, op_type, source, grant_id, amount, comment, created_at)
         VALUES(?, NULL, NULL, ?, ?, ?, ?, ?, NOW())`,
        [user_id, FreeQuestionOpTypeE.Expire, FreeQuestionSourceE.Subscription, grantId, remaining, 'Сгорание БВ по окончании подписки'],
    );
    return remaining;
}

export async function expireAllGrantsForSubscriptionTx(conn: PoolConnection, subscriptionId: number): Promise<number> {
    const [rows] = await conn.query<GrantLotRow[]>(
        `SELECT id FROM free_question_grant WHERE subscription_id = ? AND source = ? AND remaining > 0 FOR UPDATE`,
        [subscriptionId, FreeQuestionSourceE.Subscription],
    );
    let total = 0;
    for (const r of rows) {
        total += await expireSubscriptionGrantTx(conn, r.id);
    }
    return total;
}

export async function getActiveSubscriptionGrantId(
    conn: PoolConnection,
    subscriptionId: number,
): Promise<number | null> {
    const [rows] = await conn.query<GrantLotRow[]>(
        `SELECT id FROM free_question_grant
         WHERE subscription_id = ? AND source = ?
         ORDER BY id DESC LIMIT 1
         FOR UPDATE`,
        [subscriptionId, FreeQuestionSourceE.Subscription],
    );
    return rows.length ? rows[0].id : null;
}

export async function getSubscriptionGrantIdsBySubscription(subscriptionId: number): Promise<number[]> {
    const msg = msgGlobal + 'getSubscriptionGrantIdsBySubscription - ';
    try {
        const [rows] = await pool.query<GrantLotRow[]>(
            `SELECT id FROM free_question_grant WHERE subscription_id = ? AND source = ? AND remaining > 0`,
            [subscriptionId, FreeQuestionSourceE.Subscription],
        );
        return rows.map((r) => r.id);
    } catch (error) {
        logger.error(msg + 'failed', { subscription_id: subscriptionId, error });
        return [];
    }
}

export async function getSubscriptionBvRemaining(userId: number | string): Promise<number> {
    const msg = msgGlobal + 'getSubscriptionBvRemaining - ';
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(remaining), 0) AS total FROM free_question_grant
             WHERE user_id = ? AND source = ? AND remaining > 0 AND (expires_at IS NULL OR expires_at > NOW())`,
            [userId, FreeQuestionSourceE.Subscription],
        );
        return Number(rows[0]?.total ?? 0);
    } catch (error) {
        logger.error(msg + 'failed', { user_id: userId, error });
        return 0;
    }
}

export async function getExpiredSubscriptionGrantIds(cap: number = 1000): Promise<number[]> {
    const msg = msgGlobal + 'getExpiredSubscriptionGrantIds - ';
    try {
        const [rows] = await pool.query<GrantLotRow[]>(
            `SELECT id FROM free_question_grant
             WHERE source = ? AND remaining > 0 AND expires_at IS NOT NULL AND expires_at <= NOW()
             LIMIT ?`,
            [FreeQuestionSourceE.Subscription, cap],
        );
        return rows.map((r) => r.id);
    } catch (error) {
        logger.error(msg + 'failed', { error });
        return [];
    }
}
