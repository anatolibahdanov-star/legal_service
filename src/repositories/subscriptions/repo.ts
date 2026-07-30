import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool, { find, findOne, queryTransactionWrapper } from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { CountResult, DBSubscriptionPlan, DBSubscription, DBSubscriptionHistory } from '@/src/interfaces/db';
import { SubscriptionStatusE, SubscriptionEventE } from '@/src/interfaces/payment';

const msgGlobal = 'REPO SUBSCRIPTION ';

const MAX_ACTIVE_PLANS = 3;

interface PlanFilter {
    id?: Array<number | string> | number | string;
    is_active?: number | boolean;
}

export interface SavePlanResult {
    plan: DBSubscriptionPlan | null;
    error?: string;
}

interface NormalizedPlan {
    name: string;
    description: string | null;
    price_rub: number;
    bv_amount: number;
    tone: string | null;
    badge: string | null;
    featured: number;
    weight: number;
    is_active: number;
}

function toIntOrNaN(raw: unknown): number {
    if (raw === undefined || raw === null || raw === '') return NaN;
    const n = Number(raw);
    return Number.isInteger(n) ? n : NaN;
}

function validatePositiveInt(raw: unknown, label: string): { ok: boolean; value?: number; error?: string } {
    const n = toIntOrNaN(raw);
    if (Number.isNaN(n)) return { ok: false, error: `${label} должно быть целым числом.` };
    if (!Number.isSafeInteger(n)) return { ok: false, error: `${label} слишком большое.` };
    if (n <= 0) return { ok: false, error: `${label} должно быть больше 0.` };
    return { ok: true, value: n };
}

function normalizePlan(patch: Partial<DBSubscriptionPlan>, base?: DBSubscriptionPlan): { ok: boolean; error?: string; value?: NormalizedPlan } {
    const name = patch.name !== undefined ? String(patch.name).trim() : (base?.name ?? '');
    if (!name) return { ok: false, error: 'Название обязательно.' };

    const priceRaw = patch.price_rub !== undefined ? patch.price_rub : base?.price_rub;
    const price = validatePositiveInt(priceRaw, 'Стоимость');
    if (!price.ok) return { ok: false, error: price.error };

    const bvRaw = patch.bv_amount !== undefined ? patch.bv_amount : base?.bv_amount;
    const bv = validatePositiveInt(bvRaw, 'Количество бесплатных вопросов');
    if (!bv.ok) return { ok: false, error: bv.error };

    const description = patch.description !== undefined
        ? (patch.description ? String(patch.description) : null)
        : (base?.description ?? null);
    const tone = patch.tone !== undefined ? (patch.tone ? String(patch.tone) : null) : (base?.tone ?? null);
    const badge = patch.badge !== undefined ? (patch.badge ? String(patch.badge) : null) : (base?.badge ?? null);
    const featured = patch.featured !== undefined ? (patch.featured ? 1 : 0) : (base?.featured ?? 0);
    const weight = patch.weight !== undefined && Number.isFinite(Number(patch.weight)) ? Number(patch.weight) : (base?.weight ?? 0);
    const is_active = patch.is_active !== undefined ? (patch.is_active ? 1 : 0) : (base?.is_active ?? 0);

    return { ok: true, value: { name, description, price_rub: price.value!, bv_amount: bv.value!, tone, badge, featured, weight, is_active } };
}

function planOrder(orderBy: string[]): string {
    const allowed = ['id', 'name', 'price_rub', 'bv_amount', 'weight', 'is_active', 'created_at', 'updated_at'];
    if (orderBy && orderBy.length > 0 && allowed.includes(orderBy[0])) {
        const field = orderBy[0];
        const sorter = ['ASC', 'DESC'].includes(orderBy[1]) ? orderBy[1] : 'ASC';
        return field + ' ' + sorter;
    }
    return 'weight ASC, id ASC';
}

function planFilter(filter: PlanFilter | null): { where: string; values: Array<string | number | Array<string | number>> } {
    if (!filter) return { where: '', values: [] };
    const clauses: string[] = [];
    const values: Array<string | number | Array<string | number>> = [];
    if (filter.id !== undefined) {
        const ids = Array.isArray(filter.id) ? filter.id : [filter.id];
        clauses.push('id IN (?)');
        values.push(ids as Array<string | number>);
    }
    if (filter.is_active !== undefined) {
        clauses.push('is_active = ?');
        values.push(filter.is_active ? 1 : 0);
    }
    return { where: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', values };
}

export async function getPlans(
    page: string = '1', _limit: string = '100', _sorter: string[] = ['weight', 'ASC'], filter: PlanFilter | null = null,
): Promise<DBSubscriptionPlan[] | null> {
    const msg = msgGlobal + 'getPlans - ';
    const orderBy = planOrder(_sorter);
    const { where, values } = planFilter(filter);
    const limit = parseInt(_limit) || 100;
    const offset = ((parseInt(page) || 1) - 1) * limit;
    const query = `SELECT * FROM subscription_plan ` + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const findFunc = find({ query, values: [...values, limit, offset] });
    const executed = await queryTransactionWrapper<DBSubscriptionPlan>([findFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? [] : rows;
}

export async function getTotalPlans(filter: PlanFilter | null = null): Promise<number> {
    const msg = msgGlobal + 'getTotalPlans - ';
    const { where, values } = planFilter(filter);
    const query = `SELECT COUNT(id) as counter FROM subscription_plan ` + where;
    const calcFunc = findOne({ query, values });
    const executed = await queryTransactionWrapper<CountResult>([calcFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return 0;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? 0 : rows[0].counter;
}

export async function getPlanById(id: string | number): Promise<DBSubscriptionPlan | null> {
    const msg = msgGlobal + 'getPlanById - ';
    const query = `SELECT * FROM subscription_plan WHERE id = ?`;
    const findFunc = find({ query, values: [id] });
    const executed = await queryTransactionWrapper<DBSubscriptionPlan>([findFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? null : rows[0];
}

export async function getActivePlans(): Promise<DBSubscriptionPlan[]> {
    const msg = msgGlobal + 'getActivePlans - ';
    try {
        const [rows] = await pool.query<DBSubscriptionPlan[]>(
            `SELECT * FROM subscription_plan WHERE is_active = 1 ORDER BY weight ASC, id ASC`,
        );
        return rows ?? [];
    } catch (error) {
        logger.error(msg + 'failed', { error });
        return [];
    }
}

async function countActivePlansForUpdate(conn: PoolConnection, excludeId: number | null): Promise<number> {
    const [rows] = await conn.query<CountResult[]>(
        `SELECT COUNT(id) AS counter FROM subscription_plan WHERE is_active = 1 AND id <> ? FOR UPDATE`,
        [excludeId ?? 0],
    );
    return rows[0]?.counter ?? 0;
}

export async function createPlan(patch: Partial<DBSubscriptionPlan>): Promise<SavePlanResult> {
    const msg = msgGlobal + 'createPlan - ';
    const normalized = normalizePlan(patch);
    if (!normalized.ok || !normalized.value) return { plan: null, error: normalized.error };
    const v = normalized.value;

    const conn = await pool.getConnection();
    let insertedId: number | null = null;
    try {
        await conn.beginTransaction();
        if (v.is_active === 1) {
            const active = await countActivePlansForUpdate(conn, null);
            if (active >= MAX_ACTIVE_PLANS) {
                await conn.rollback();
                return { plan: null, error: `Нельзя включить больше ${MAX_ACTIVE_PLANS} тарифов одновременно.` };
            }
        }
        const [res] = await conn.query<ResultSetHeader>(
            `INSERT INTO subscription_plan (name, description, price_rub, bv_amount, tone, badge, featured, weight, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [v.name, v.description, v.price_rub, v.bv_amount, v.tone, v.badge, v.featured, v.weight, v.is_active],
        );
        insertedId = res.insertId;
        await conn.commit();
        logger.info(msg + 'created', { id: insertedId, name: v.name });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { error });
        return { plan: null, error: 'Ошибка при создании тарифа.' };
    } finally {
        conn.release();
    }
    return { plan: insertedId ? await getPlanById(insertedId) : null };
}

export async function savePlan(id: string | number, patch: Partial<DBSubscriptionPlan>): Promise<SavePlanResult> {
    const msg = msgGlobal + 'savePlan - ';
    const current = await getPlanById(id);
    if (!current) return { plan: null, error: 'Тариф не найден.' };
    const normalized = normalizePlan(patch, current);
    if (!normalized.ok || !normalized.value) return { plan: null, error: normalized.error };
    const v = normalized.value;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        if (v.is_active === 1) {
            const active = await countActivePlansForUpdate(conn, Number(id));
            if (active >= MAX_ACTIVE_PLANS) {
                await conn.rollback();
                return { plan: null, error: `Нельзя включить больше ${MAX_ACTIVE_PLANS} тарифов одновременно.` };
            }
        }
        await conn.query<ResultSetHeader>(
            `UPDATE subscription_plan
             SET name = ?, description = ?, price_rub = ?, bv_amount = ?, tone = ?, badge = ?, featured = ?, weight = ?, is_active = ?
             WHERE id = ?`,
            [v.name, v.description, v.price_rub, v.bv_amount, v.tone, v.badge, v.featured, v.weight, v.is_active, id],
        );
        await conn.commit();
        logger.info(msg + 'saved', { id, name: v.name });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { id, error });
        return { plan: null, error: 'Ошибка при сохранении тарифа.' };
    } finally {
        conn.release();
    }
    return { plan: await getPlanById(id) };
}

export async function deletePlan(id: string | number): Promise<{ ok: boolean; error?: string }> {
    const msg = msgGlobal + 'deletePlan - ';
    try {
        await pool.query<ResultSetHeader>(`DELETE FROM subscription_plan WHERE id = ?`, [id]);
        logger.info(msg + 'deleted', { id });
        return { ok: true };
    } catch (error) {
        logger.error(msg + 'failed', { id, error });
        return { ok: false, error: 'Не удалось удалить тариф.' };
    }
}

export async function getActiveSubscriptionByUser(userId: number | string): Promise<DBSubscription | null> {
    const msg = msgGlobal + 'getActiveSubscriptionByUser - ';
    try {
        const [rows] = await pool.query<DBSubscription[]>(
            `SELECT * FROM subscription WHERE user_id = ? AND status = ? ORDER BY id DESC LIMIT 1`,
            [userId, SubscriptionStatusE.Active],
        );
        return rows.length ? rows[0] : null;
    } catch (error) {
        logger.error(msg + 'failed', { user_id: userId, error });
        return null;
    }
}

export async function getSubscriptionHistory(userId: number | string, cap: number = 500): Promise<DBSubscriptionHistory[]> {
    const msg = msgGlobal + 'getSubscriptionHistory - ';
    try {
        const [rows] = await pool.query<DBSubscriptionHistory[]>(
            `SELECT h.*, p.name AS current_plan_name
             FROM subscription_history h
             LEFT JOIN subscription_plan p ON h.plan_id = p.id
             WHERE h.user_id = ?
             ORDER BY h.created_at DESC, h.id DESC
             LIMIT ?`,
            [userId, cap],
        );
        return rows ?? [];
    } catch (error) {
        logger.error(msg + 'failed', { user_id: userId, error });
        return [];
    }
}

export interface SubscriptionQuestionStats {
    remaining: number;
    initial: number;
}

export async function getSubscriptionQuestionStats(subscriptionId: number): Promise<SubscriptionQuestionStats> {
    const msg = msgGlobal + 'getSubscriptionQuestionStats - ';
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(remaining), 0) AS remaining, COALESCE(SUM(initial), 0) AS total
             FROM free_question_grant
             WHERE subscription_id = ? AND source = 2`,
            [subscriptionId],
        );
        const row = rows[0] ?? {};
        return { remaining: Number(row.remaining) || 0, initial: Number(row.total) || 0 };
    } catch (error) {
        logger.error(msg + 'failed', { subscription_id: subscriptionId, error });
        return { remaining: 0, initial: 0 };
    }
}

export interface DBSubscriptionCancelRow extends RowDataPacket {
    id: number;
    created_at: string;
    comment: string | null;
    plan_name: string | null;
    admin_name: string | null;
    admin_username: string | null;
}

export async function getUserSubscriptionCancelEvents(
    userId: number | string,
    cap: number = 2000,
): Promise<DBSubscriptionCancelRow[]> {
    const msg = msgGlobal + 'getUserSubscriptionCancelEvents - ';
    try {
        const [rows] = await pool.query<DBSubscriptionCancelRow[]>(
            `SELECT h.id, h.created_at, h.comment, h.plan_name,
                a.name AS admin_name, a.username AS admin_username
             FROM subscription_history h
             LEFT JOIN administrator a ON h.admin_id = a.id
             WHERE h.user_id = ? AND h.event_type = ?
             ORDER BY h.created_at DESC, h.id DESC
             LIMIT ?`,
            [userId, SubscriptionEventE.Cancel, cap],
        );
        return rows ?? [];
    } catch (error) {
        logger.error(msg + 'failed', { user_id: userId, error });
        return [];
    }
}

export async function insertSubscriptionHistoryTx(
    conn: PoolConnection,
    row: {
        subscriptionId: number;
        userId: number | string;
        eventType: SubscriptionEventE;
        planId: number | null;
        planName: string | null;
        priceRub: number | null;
        bvAmount: number | null;
        bvDelta: number | null;
        periodStart: string | null;
        periodEnd: string | null;
        statusAfter: SubscriptionStatusE;
        orderId: number | null;
        adminId: number | null;
        comment: string | null;
    },
): Promise<number> {
    const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO subscription_history
         (subscription_id, user_id, event_type, plan_id, plan_name, price_rub, bv_amount, bv_delta,
          period_start, period_end, status_after, order_id, admin_id, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            row.subscriptionId, row.userId, row.eventType, row.planId, row.planName, row.priceRub, row.bvAmount, row.bvDelta,
            row.periodStart, row.periodEnd, row.statusAfter, row.orderId, row.adminId, row.comment,
        ],
    );
    return res.insertId;
}
