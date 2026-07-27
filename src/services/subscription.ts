import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { User } from 'next-auth';
import pool from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { DBSubscription, DBSubscriptionPlan, DBOrder } from '@/src/interfaces/db';
import { SubscriptionStatusE, SubscriptionEventE, OrderTypeE, OrderStatusE, AlfaOrderStatusE } from '@/src/interfaces/payment';
import { PaymentStatusUpdateI, UserBalanceRequest } from '@/src/interfaces/api';
import { getPlanById, insertSubscriptionHistoryTx } from '@/src/repositories/subscriptions/repo';
import { createEmptyOrder, updateOrderStatus } from '@/src/repositories/orders/repo';
import { chargeAlfaBinding, getAlfaOrderStatus } from '@/src/libs/alfa.pay';
import {
    accrueSubscriptionGrantTx,
    topUpSubscriptionGrantTx,
    debitSubscriptionGrantsTx,
    expireAllGrantsForSubscriptionTx,
    expireSubscriptionGrantTx,
    getActiveSubscriptionGrantId,
    getExpiredSubscriptionGrantIds,
} from '@/src/repositories/freeQuestions/grants';

const msgGlobal = 'SERVICE SUBSCRIPTION ';

// Recurring charge is attempted this many days BEFORE period_end so a
// continuous renewal (and its retries) can succeed before the expiry cron
// would lapse the subscription.
const RENEWAL_LEAD_DAYS = 1;

const pad = (n: number): string => (n < 10 ? '0' + n : '' + n);

function toMysqlDateTime(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function addMonths(d: Date, n: number): Date {
    const r = new Date(d.getTime());
    r.setMonth(r.getMonth() + n);
    return r;
}

function addDays(d: Date, n: number): Date {
    const r = new Date(d.getTime());
    r.setDate(r.getDate() + n);
    return r;
}

function nextChargeFrom(periodEnd: Date): string {
    return toMysqlDateTime(addDays(periodEnd, -RENEWAL_LEAD_DAYS));
}

function dbDateToStr(v: unknown): string | null {
    if (!v) return null;
    const d = new Date(v as string | number | Date);
    return Number.isNaN(d.getTime()) ? null : toMysqlDateTime(d);
}

export type SubscriptionEventName = 'purchase' | 'renew' | 'upgrade' | 'downgrade';

export interface ApplySubscriptionResult {
    ok: boolean;
    event?: SubscriptionEventName;
    subscriptionId?: number;
    error?: string;
}

export async function applySubscriptionOrder(
    userId: number | string,
    planId: number | string,
    orderId: number | null,
    bindingId: string | null = null,
    isAutoRenewal: boolean = false,
): Promise<ApplySubscriptionResult> {
    const msg = msgGlobal + 'applySubscriptionOrder - ';
    const plan: DBSubscriptionPlan | null = await getPlanById(planId);
    if (!plan) {
        logger.error(msg + 'plan not found', { user_id: userId, plan_id: planId });
        return { ok: false, error: 'Тариф не найден.' };
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`SELECT id FROM user WHERE id = ? FOR UPDATE`, [userId]);

        if (orderId !== null) {
            const [dupRows] = await conn.query<RowDataPacket[]>(
                `SELECT id FROM subscription_history WHERE order_id = ? AND event_type IN (?, ?, ?, ?) LIMIT 1`,
                [orderId, SubscriptionEventE.Purchase, SubscriptionEventE.Renew, SubscriptionEventE.Upgrade, SubscriptionEventE.Downgrade],
            );
            if (dupRows.length > 0) {
                await conn.commit();
                logger.info(msg + 'order already applied, skipping', { user_id: userId, order_id: orderId, plan_id: plan.id });
                return { ok: true };
            }
        }

        const [activeRows] = await conn.query<DBSubscription[]>(
            `SELECT * FROM subscription WHERE user_id = ? AND status = ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
            [userId, SubscriptionStatusE.Active],
        );
        const active = activeRows.length ? activeRows[0] : null;

        const now = new Date();
        const nowStr = toMysqlDateTime(now);

        if (!active) {
            const periodEnd = addMonths(now, 1);
            const endStr = toMysqlDateTime(periodEnd);
            const nextChargeStr = nextChargeFrom(periodEnd);
            const [subRes] = await conn.query<ResultSetHeader>(
                `INSERT INTO subscription (user_id, plan_id, status, price_rub, bv_amount, period_start, period_end, binding_id, next_charge_at, order_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [userId, plan.id, SubscriptionStatusE.Active, plan.price_rub, plan.bv_amount, nowStr, endStr, bindingId, nextChargeStr, orderId],
            );
            const subscriptionId = subRes.insertId;
            await accrueSubscriptionGrantTx(conn, userId, plan.bv_amount, subscriptionId, endStr);
            await insertSubscriptionHistoryTx(conn, {
                subscriptionId, userId, eventType: SubscriptionEventE.Purchase,
                planId: plan.id, planName: plan.name, priceRub: plan.price_rub,
                bvAmount: plan.bv_amount, bvDelta: plan.bv_amount,
                periodStart: nowStr, periodEnd: endStr, statusAfter: SubscriptionStatusE.Active,
                orderId, adminId: null, comment: null,
            });
            await conn.commit();
            logger.info(msg + 'purchase', { user_id: userId, subscription_id: subscriptionId, plan_id: plan.id });
            return { ok: true, event: 'purchase', subscriptionId };
        }

        const grantId = await getActiveSubscriptionGrantId(conn, active.id);
        const samePlan = Number(active.plan_id) === Number(plan.id);

        if (samePlan) {
            const oldEnd = active.period_end ? new Date(active.period_end as unknown as string) : now;
            const base = oldEnd > now ? oldEnd : now;
            const newEnd = addMonths(base, 1);
            const endStr = toMysqlDateTime(newEnd);
            // Only the automated renewal path honours a mid-charge cancellation
            // (next_charge_at set to NULL): apply the paid period but do NOT
            // re-arm. A user-initiated payment (purchase / re-subscribe) always
            // arms auto-renew — otherwise a re-subscribe after cancel would
            // silently stay non-renewing.
            const reArm = isAutoRenewal && active.next_charge_at === null ? null : nextChargeFrom(newEnd);
            if (grantId) {
                await topUpSubscriptionGrantTx(conn, grantId, userId, plan.bv_amount, endStr);
            } else {
                await accrueSubscriptionGrantTx(conn, userId, plan.bv_amount, active.id, endStr);
            }
            await conn.query<ResultSetHeader>(
                `UPDATE subscription SET price_rub = ?, bv_amount = ?, period_end = ?, next_charge_at = ?, binding_id = COALESCE(?, binding_id), order_id = ? WHERE id = ?`,
                [plan.price_rub, plan.bv_amount, endStr, reArm, bindingId, orderId, active.id],
            );
            await insertSubscriptionHistoryTx(conn, {
                subscriptionId: active.id, userId, eventType: SubscriptionEventE.Renew,
                planId: plan.id, planName: plan.name, priceRub: plan.price_rub,
                bvAmount: plan.bv_amount, bvDelta: plan.bv_amount,
                periodStart: dbDateToStr(active.period_start), periodEnd: endStr, statusAfter: SubscriptionStatusE.Active,
                orderId, adminId: null, comment: null,
            });
            await conn.commit();
            logger.info(msg + 'renew', { user_id: userId, subscription_id: active.id, plan_id: plan.id });
            return { ok: true, event: 'renew', subscriptionId: active.id };
        }

        const periodEnd = addMonths(now, 1);
        const endStr = toMysqlDateTime(periodEnd);
        const nextChargeStr = nextChargeFrom(periodEnd);
        const delta = plan.bv_amount - active.bv_amount;
        let event: SubscriptionEventName;
        let bvDelta: number;

        if (delta >= 0) {
            if (grantId) {
                await topUpSubscriptionGrantTx(conn, grantId, userId, delta, endStr);
            } else {
                await accrueSubscriptionGrantTx(conn, userId, plan.bv_amount, active.id, endStr);
            }
            event = 'upgrade';
            bvDelta = grantId ? delta : plan.bv_amount;
        } else {
            const debited = await debitSubscriptionGrantsTx(conn, userId, -delta, 'Списание БВ при смене тарифа');
            if (grantId) {
                await topUpSubscriptionGrantTx(conn, grantId, userId, 0, endStr);
            }
            event = 'downgrade';
            bvDelta = -debited;
        }

        await conn.query<ResultSetHeader>(
            `UPDATE subscription SET plan_id = ?, price_rub = ?, bv_amount = ?, period_start = ?, period_end = ?, next_charge_at = ?, binding_id = COALESCE(?, binding_id), order_id = ? WHERE id = ?`,
            [plan.id, plan.price_rub, plan.bv_amount, nowStr, endStr, nextChargeStr, bindingId, orderId, active.id],
        );
        await insertSubscriptionHistoryTx(conn, {
            subscriptionId: active.id, userId,
            eventType: event === 'upgrade' ? SubscriptionEventE.Upgrade : SubscriptionEventE.Downgrade,
            planId: plan.id, planName: plan.name, priceRub: plan.price_rub,
            bvAmount: plan.bv_amount, bvDelta,
            periodStart: nowStr, periodEnd: endStr, statusAfter: SubscriptionStatusE.Active,
            orderId, adminId: null, comment: null,
        });
        await conn.commit();
        logger.info(msg + event, { user_id: userId, subscription_id: active.id, plan_id: plan.id, bv_delta: bvDelta });
        return { ok: true, event, subscriptionId: active.id };
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { user_id: userId, plan_id: planId, error });
        return { ok: false, error: 'Ошибка при активации подписки.' };
    } finally {
        conn.release();
    }
}

export interface CancelSubscriptionResult {
    ok: boolean;
    error?: string;
    periodEnd?: string | null;
}

export async function cancelSubscription(
    userId: number | string,
    adminId: number | null = null,
): Promise<CancelSubscriptionResult> {
    const msg = msgGlobal + 'cancelSubscription - ';
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`SELECT id FROM user WHERE id = ? FOR UPDATE`, [userId]);
        const [rows] = await conn.query<DBSubscription[]>(
            `SELECT * FROM subscription WHERE user_id = ? AND status = ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
            [userId, SubscriptionStatusE.Active],
        );
        if (rows.length === 0) {
            await conn.rollback();
            return { ok: false, error: 'Активная подписка не найдена.' };
        }
        const sub = rows[0];
        const plan = sub.plan_id ? await getPlanById(sub.plan_id) : null;
        await conn.query<ResultSetHeader>(`UPDATE subscription SET next_charge_at = NULL WHERE id = ?`, [sub.id]);
        await insertSubscriptionHistoryTx(conn, {
            subscriptionId: sub.id, userId, eventType: SubscriptionEventE.Cancel,
            planId: sub.plan_id, planName: plan?.name ?? null, priceRub: sub.price_rub,
            bvAmount: null, bvDelta: null,
            periodStart: dbDateToStr(sub.period_start), periodEnd: dbDateToStr(sub.period_end),
            statusAfter: SubscriptionStatusE.Active, orderId: null, adminId,
            comment: 'Отписка от автопродления — подписка действует до конца оплаченного периода',
        });
        await conn.commit();
        logger.info(msg + 'cancelled', { user_id: userId, subscription_id: sub.id, admin_id: adminId });
        return { ok: true, periodEnd: dbDateToStr(sub.period_end) };
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { user_id: userId, error });
        return { ok: false, error: 'Не удалось отменить подписку.' };
    } finally {
        conn.release();
    }
}

interface LapsedRow extends RowDataPacket {
    id: number;
}

export async function expireSubscriptionsTick(): Promise<{ expiredSubscriptions: number; sweptGrants: number }> {
    const msg = msgGlobal + 'expireSubscriptionsTick - ';
    let expiredSubscriptions = 0;
    let sweptGrants = 0;

    let candidates: number[] = [];
    try {
        const [rows] = await pool.query<LapsedRow[]>(
            `SELECT id FROM subscription
             WHERE status = ? AND period_end IS NOT NULL AND period_end <= NOW()
               AND (next_charge_at IS NULL OR next_charge_at <= NOW())
             LIMIT 500`,
            [SubscriptionStatusE.Active],
        );
        candidates = rows.map((r) => r.id);
    } catch (error) {
        logger.error(msg + 'failed to load lapsed subscriptions', { error });
        return { expiredSubscriptions, sweptGrants };
    }

    for (const subId of candidates) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const [rows] = await conn.query<DBSubscription[]>(
                `SELECT * FROM subscription WHERE id = ? AND status = ? AND period_end <= NOW()
                   AND (next_charge_at IS NULL OR next_charge_at <= NOW()) FOR UPDATE`,
                [subId, SubscriptionStatusE.Active],
            );
            if (rows.length === 0) {
                await conn.rollback();
                continue;
            }
            const sub = rows[0];
            const expiredTotal = await expireAllGrantsForSubscriptionTx(conn, sub.id);
            await conn.query<ResultSetHeader>(`UPDATE subscription SET status = ? WHERE id = ?`, [SubscriptionStatusE.Expired, sub.id]);
            const plan = sub.plan_id ? await getPlanById(sub.plan_id) : null;
            await insertSubscriptionHistoryTx(conn, {
                subscriptionId: sub.id, userId: sub.user_id, eventType: SubscriptionEventE.Expire,
                planId: sub.plan_id, planName: plan?.name ?? null, priceRub: sub.price_rub,
                bvAmount: 0, bvDelta: -expiredTotal,
                periodStart: dbDateToStr(sub.period_start), periodEnd: dbDateToStr(sub.period_end),
                statusAfter: SubscriptionStatusE.Expired, orderId: null, adminId: null,
                comment: 'Срок действия подписки истёк',
            });
            await conn.commit();
            expiredSubscriptions += 1;
        } catch (error) {
            await conn.rollback();
            logger.error(msg + 'failed to expire subscription', { subscription_id: subId, error });
        } finally {
            conn.release();
        }
    }

    const orphanGrantIds = await getExpiredSubscriptionGrantIds();
    for (const grantId of orphanGrantIds) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const swept = await expireSubscriptionGrantTx(conn, grantId);
            await conn.commit();
            if (swept > 0) sweptGrants += 1;
        } catch (error) {
            await conn.rollback();
            logger.error(msg + 'failed to sweep grant', { grant_id: grantId, error });
        } finally {
            conn.release();
        }
    }

    if (expiredSubscriptions > 0 || sweptGrants > 0) {
        logger.info(msg + 'done', { expiredSubscriptions, sweptGrants });
    }
    return { expiredSubscriptions, sweptGrants };
}

export async function renewSubscriptionsTick(): Promise<{ renewed: number; failed: number }> {
    const msg = msgGlobal + 'renewSubscriptionsTick - ';
    let renewed = 0;
    let failed = 0;

    let candidates: number[] = [];
    try {
        const [rows] = await pool.query<LapsedRow[]>(
            `SELECT id FROM subscription
             WHERE status = ? AND binding_id IS NOT NULL AND plan_id IS NOT NULL
               AND next_charge_at IS NOT NULL AND next_charge_at <= NOW()
               AND period_end > NOW()
             LIMIT 200`,
            [SubscriptionStatusE.Active],
        );
        candidates = rows.map((r) => r.id);
    } catch (error) {
        logger.error(msg + 'failed to load renewable subscriptions', { error });
        return { renewed, failed };
    }

    for (const subId of candidates) {
        try {
            // Atomically claim the subscription before charging: push next_charge_at
            // forward so an overlapping run cannot pick and double-charge it. A real
            // charge failure below leaves this +1h value, which retries later.
            const [claimRes] = await pool.query<ResultSetHeader>(
                `UPDATE subscription SET next_charge_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
                 WHERE id = ? AND status = ? AND next_charge_at IS NOT NULL AND next_charge_at <= NOW()
                   AND period_end > NOW()`,
                [subId, SubscriptionStatusE.Active],
            );
            if ((claimRes.affectedRows ?? 0) !== 1) continue;

            const [subRows] = await pool.query<DBSubscription[]>(`SELECT * FROM subscription WHERE id = ?`, [subId]);
            if (subRows.length === 0) continue;
            const sub = subRows[0];
            if (sub.status !== SubscriptionStatusE.Active || !sub.binding_id || !sub.plan_id) continue;

            const plan = await getPlanById(sub.plan_id);
            if (!plan) {
                logger.warn(msg + 'plan missing, skipping renewal', { subscription_id: sub.id, plan_id: sub.plan_id });
                continue;
            }

            const user = { id: String(sub.user_id) } as User;
            const clientId = String(sub.user_id);
            const amountKop = Math.round(sub.price_rub * 100);

            const orderRequest: UserBalanceRequest = {
                amount: sub.price_rub,
                orderNumber: `sub_renew_${sub.id}`,
                type: OrderTypeE.Subscription,
                status: OrderStatusE.InProgress,
                data: { planId: sub.plan_id },
            };
            const order = await createEmptyOrder(clientId, orderRequest);
            if (!order) {
                logger.error(msg + 'failed to create renewal order', { subscription_id: sub.id });
                failed += 1;
                continue;
            }

            const charge = await chargeAlfaBinding(amountKop, order.id, user, clientId, sub.binding_id);
            if (!charge.status || !charge.data?.orderId) {
                // No confirmed capture — safe to retry on a later tick (the +1h claim
                // gates re-picking). Residual: if a capture happened but the response
                // was lost, a retry could double-charge — fully closing that needs a
                // stable Alfa idempotency key (documented follow-up).
                logger.error(msg + 'recurring charge failed (no confirmed capture)', { subscription_id: sub.id, order_id: order.id, error: charge.error });
                await updateOrderStatus({
                    order_id: order.id, status: OrderStatusE.Error, alpha_id: String(charge.data?.orderId ?? ''),
                    alpha_status: AlfaOrderStatusE.DeclineAuth, transaction_info: JSON.stringify(charge.techical_data ?? {}),
                } as PaymentStatusUpdateI);
                failed += 1;
                continue;
            }

            // Capture confirmed (paymentOrderBinding.do succeeded). Never re-charge
            // beyond this point: mark the order Paid and apply. If apply fails, the
            // reconcile pass completes it against THIS paid order (idempotent by
            // order_id) before the +1h claim lets renewal re-pick the subscription.
            const mdOrder = String(charge.data.orderId);
            await updateOrderStatus({
                order_id: order.id, status: OrderStatusE.Paid, alpha_id: mdOrder,
                alpha_status: AlfaOrderStatusE.Auth, transaction_info: JSON.stringify(charge.techical_data ?? {}),
            } as PaymentStatusUpdateI);

            const applied = await applySubscriptionOrder(sub.user_id, sub.plan_id, parseInt(order.id), sub.binding_id, true);
            if (applied.ok) {
                renewed += 1;
                logger.info(msg + 'renewed', { subscription_id: sub.id, order_id: order.id, event: applied.event });
            } else {
                failed += 1;
                logger.error(msg + 'captured but apply deferred to reconcile', { subscription_id: sub.id, order_id: order.id, error: applied.error });
            }
        } catch (error) {
            failed += 1;
            logger.error(msg + 'renewal exception', { subscription_id: subId, error });
        }
    }

    if (renewed > 0 || failed > 0) {
        logger.info(msg + 'done', { renewed, failed });
    }
    return { renewed, failed };
}

export async function reconcileSubscriptionOrders(): Promise<{ reconciled: number; failed: number }> {
    const msg = msgGlobal + 'reconcileSubscriptionOrders - ';
    let reconciled = 0;
    let failed = 0;

    let orders: DBOrder[] = [];
    try {
        const [rows] = await pool.query<DBOrder[]>(
            `SELECT p.* FROM porder p
             WHERE p.order_type = ? AND p.status = ?
               AND NOT EXISTS (
                 SELECT 1 FROM subscription_history h
                 WHERE h.order_id = p.id AND h.event_type IN (?, ?, ?, ?)
               )
             ORDER BY p.id ASC LIMIT 100`,
            [
                OrderTypeE.Subscription, OrderStatusE.Paid,
                SubscriptionEventE.Purchase, SubscriptionEventE.Renew, SubscriptionEventE.Upgrade, SubscriptionEventE.Downgrade,
            ],
        );
        orders = rows;
    } catch (error) {
        logger.error(msg + 'failed to load unapplied paid orders', { error });
        return { reconciled, failed };
    }

    for (const order of orders) {
        try {
            let planId: number | null = order.plan_id ?? null;
            if (planId === null && order.data) {
                try {
                    const parsed = JSON.parse(order.data);
                    if (parsed?.planId) planId = Number(parsed.planId);
                } catch { /* ignore */ }
            }
            if (!planId) {
                logger.warn(msg + 'paid subscription order without planId — cannot apply', { order_id: order.id });
                continue;
            }
            const user = { id: String(order.user_id) } as User;
            let bindingId: string | null = null;
            try {
                const status = await getAlfaOrderStatus(order.alpha_id, user, true);
                bindingId = status.data?.bindingInfo?.bindingId ?? status.data?.bindingId ?? null;
            } catch { /* best-effort binding recovery */ }

            // isAutoRenewal=true is a no-op for a first-payment (Purchase branch
            // arms unconditionally) but preserves a mid-charge cancellation when
            // reconcile completes a failed renewal.
            const applied = await applySubscriptionOrder(order.user_id, planId, parseInt(order.id), bindingId, true);
            if (applied.ok) {
                reconciled += 1;
                logger.info(msg + 'reconciled', { order_id: order.id, event: applied.event });
            } else {
                failed += 1;
                logger.error(msg + 'apply failed', { order_id: order.id, error: applied.error });
            }
        } catch (error) {
            failed += 1;
            logger.error(msg + 'reconcile exception', { order_id: order.id, error });
        }
    }

    if (reconciled > 0 || failed > 0) {
        logger.info(msg + 'done', { reconciled, failed });
    }
    return { reconciled, failed };
}
