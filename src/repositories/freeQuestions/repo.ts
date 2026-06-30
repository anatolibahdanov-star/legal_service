import logger from "@/src/libs/logger"
import pool, { find, queryTransactionWrapper } from '@/src/libs/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { FreeQuestionOpTypeE } from "@/src/interfaces/payment";

const msgGlobal = "REPO FREE-QUESTION "

export interface DBFreeQuestionOperationRow extends RowDataPacket {
    id: number;
    op_type: FreeQuestionOpTypeE;
    amount: number;
    comment: string | null;
    created_at: string;
    admin_id: number | null;
    admin_name: string | null;
    admin_username: string | null;
    question_id: number | null;
    question_uuid: string | null;
}

/**
 * Начисление бесплатных вопросов администратором. Пишет строку в леджер
 * (op_type=Accrual) и атомарно увеличивает user.free_questions в одной
 * транзакции на выделенном соединении. `count` — положительное целое.
 */
export async function accrueFreeQuestions(
    userId: number | string,
    count: number,
    adminId: number | null,
    comment: string | null,
): Promise<{ ok: boolean; operationId?: number }> {
    const msg = msgGlobal + 'accrueFreeQuestions - ';
    if (!Number.isInteger(count) || count <= 0) {
        logger.error(msg + 'invalid count', { user_id: userId, count });
        return { ok: false };
    }
    const insertSQL = `
        INSERT INTO free_question_operation(user_id, admin_id, question_id, op_type, amount, comment, created_at)
        VALUES(?, ?, NULL, ?, ?, ?, NOW())
    `;
    const insertParams = [userId, adminId, FreeQuestionOpTypeE.Accrual, count, comment];
    const updateSQL = `UPDATE user SET free_questions = free_questions + ? WHERE id = ?`;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [insRes] = await conn.query<ResultSetHeader>(insertSQL, insertParams);
        await conn.query<ResultSetHeader>(updateSQL, [count, userId]);
        await conn.commit();
        const operationId = insRes.insertId;
        logger.info(msg + 'accrued', { user_id: userId, count, admin_id: adminId, operation_id: operationId });
        return { ok: true, operationId };
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { user_id: userId, count, error });
        return { ok: false };
    } finally {
        conn.release();
    }
}

export interface ChargeFreeQuestionResult {
    ok: boolean;
    reason?: 'none_available' | 'db_error';
    operationId?: number;
}

/**
 * Списывает один бесплатный вопрос. Атомарный условный декремент
 * (`free_questions >= 1`) защищает от ухода в минус при гонке. На успехе
 * пишет строку Charge в леджер с привязкой к вопросу.
 */
export async function chargeFreeQuestion(
    userId: number | string,
    questionId: number | string | null,
): Promise<ChargeFreeQuestionResult> {
    const msg = msgGlobal + 'chargeFreeQuestion - ';
    const deductSQL = `UPDATE user SET free_questions = free_questions - 1 WHERE id = ? AND free_questions >= 1`;
    const insertSQL = `
        INSERT INTO free_question_operation(user_id, admin_id, question_id, op_type, amount, comment, created_at)
        VALUES(?, NULL, ?, ?, ?, NULL, NOW())
    `;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [deductRes] = await conn.query<ResultSetHeader>(deductSQL, [userId]);
        if ((deductRes.affectedRows ?? 0) === 0) {
            await conn.rollback();
            return { ok: false, reason: 'none_available' };
        }
        const [insRes] = await conn.query<ResultSetHeader>(insertSQL, [
            userId,
            questionId,
            FreeQuestionOpTypeE.Charge,
            1,
        ]);
        await conn.commit();
        const operationId = insRes.insertId;
        logger.info(msg + 'charged', { user_id: userId, question_id: questionId, operation_id: operationId });
        return { ok: true, operationId };
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { user_id: userId, question_id: questionId, error });
        return { ok: false, reason: 'db_error' };
    } finally {
        conn.release();
    }
}

export async function getUserFreeQuestionOperations(
    userId: number | string,
    cap: number = 2000,
): Promise<DBFreeQuestionOperationRow[]> {
    const msg = msgGlobal + 'getUserFreeQuestionOperations - ';
    const query = `SELECT o.id, o.op_type, o.amount, o.comment, o.created_at, o.admin_id, o.question_id,
        a.name admin_name, a.username admin_username, q.uuid question_uuid
        FROM free_question_operation o
        LEFT JOIN administrator a ON o.admin_id = a.id
        LEFT JOIN question q ON o.question_id = q.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT ?`;
    const findFunc = find({ query, values: [userId, cap] });
    const executedQueries = await queryTransactionWrapper<DBFreeQuestionOperationRow>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + 'SQL not results from execution', query);
        return [];
    }
    const [[rows]] = executedQueries;
    return rows ?? [];
}
