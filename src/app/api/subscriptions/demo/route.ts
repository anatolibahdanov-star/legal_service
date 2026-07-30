import { NextRequest, NextResponse } from 'next/server';
import pool from '@/src/libs/db';
import logger from '@/src/libs/logger';
import type { ResultSetHeader } from 'mysql2/promise';
import { renewSubscriptionsTick, expireSubscriptionsTick } from '@/src/services/subscription';
import { getActiveSubscriptionByUser, getSubscriptionQuestionStats } from '@/src/repositories/subscriptions/repo';
import { unBindAlfaCard } from '@/src/libs/alfa.pay';
import { SubscriptionStatusE } from '@/src/interfaces/payment';

export const dynamic = 'force-dynamic';

const cmnMsg = 'API SUBSCRIPTION DEMO ';

async function subscriptionSnapshot(userId: number) {
    const sub = await getActiveSubscriptionByUser(userId);
    if (!sub) return null;
    const questions = await getSubscriptionQuestionStats(sub.id);
    return {
        id: sub.id,
        status: sub.status,
        planId: sub.plan_id,
        priceRub: sub.price_rub,
        periodStart: sub.period_start,
        periodEnd: sub.period_end,
        nextChargeAt: sub.next_charge_at,
        hasBinding: sub.binding_id !== null,
        questionsRemaining: questions.remaining,
        questionsTotal: questions.initial,
    };
}

export async function POST(request: NextRequest) {
    const msg = cmnMsg + 'POST - ';
    const secret = process.env.DEMO_SECRET;
    if (!secret || request.headers.get('x-demo-token') !== secret) {
        return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    }

    let body: { action?: string; userId?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Некорректный JSON.' }, { status: 400 });
    }
    const action = body.action ?? '';
    const userId = Number(body.userId);

    try {
        switch (action) {
            case 'status': {
                if (!userId) return NextResponse.json({ success: false, message: 'userId обязателен.' }, { status: 400 });
                return NextResponse.json({ success: true, subscription: await subscriptionSnapshot(userId) });
            }
            case 'arm-renew': {
                if (!userId) return NextResponse.json({ success: false, message: 'userId обязателен.' }, { status: 400 });
                const [res] = await pool.query<ResultSetHeader>(
                    `UPDATE subscription SET next_charge_at = NOW() WHERE user_id = ? AND status = ?`,
                    [userId, SubscriptionStatusE.Active],
                );
                logger.info(msg + 'arm-renew', { user_id: userId, affected: res.affectedRows });
                return NextResponse.json({ success: true, affected: res.affectedRows });
            }
            case 'arm-expire': {
                if (!userId) return NextResponse.json({ success: false, message: 'userId обязателен.' }, { status: 400 });
                const [res] = await pool.query<ResultSetHeader>(
                    `UPDATE subscription SET period_end = NOW(), next_charge_at = NULL WHERE user_id = ? AND status = ?`,
                    [userId, SubscriptionStatusE.Active],
                );
                logger.info(msg + 'arm-expire', { user_id: userId, affected: res.affectedRows });
                return NextResponse.json({ success: true, affected: res.affectedRows });
            }
            case 'unbind': {
                if (!userId) return NextResponse.json({ success: false, message: 'userId обязателен.' }, { status: 400 });
                const sub = await getActiveSubscriptionByUser(userId);
                if (!sub?.binding_id) {
                    return NextResponse.json({ success: false, message: 'Активная подписка со связкой не найдена.' }, { status: 404 });
                }
                const result = await unBindAlfaCard(sub.binding_id);
                logger.info(msg + 'unbind', { user_id: userId, ok: result.status });
                return NextResponse.json({ success: result.status, message: result.error || undefined });
            }
            case 'renew-tick': {
                const result = await renewSubscriptionsTick();
                logger.info(msg + 'renew-tick', result);
                return NextResponse.json({ success: true, ...result });
            }
            case 'expire-tick': {
                const result = await expireSubscriptionsTick();
                logger.info(msg + 'expire-tick', result);
                return NextResponse.json({ success: true, ...result });
            }
            default:
                return NextResponse.json({ success: false, message: 'Неизвестное действие.' }, { status: 400 });
        }
    } catch (err) {
        logger.error(msg + 'error', { action, user_id: userId, error: (err as Error).message });
        return NextResponse.json({ success: false, message: 'Внутренняя ошибка.' }, { status: 500 });
    }
}
