import logger from '@/src/libs/logger';
import { expireSubscriptionsTick, reconcileSubscriptionOrders } from '@/src/services/subscription';

export async function expireSubscriptions(): Promise<void> {
    const msg = 'CRON EXPIRE-SUBSCRIPTIONS ';
    // Reconcile first: complete any paid-but-unapplied subscription orders
    // (captured charge whose apply failed) before expiry could lapse them.
    try {
        await reconcileSubscriptionOrders();
    } catch (error) {
        logger.error(msg + 'reconcile failed', error);
    }
    try {
        const result = await expireSubscriptionsTick();
        if (result.expiredSubscriptions > 0 || result.sweptGrants > 0) {
            logger.info(msg + 'done', result);
        }
    } catch (error) {
        logger.error(msg + 'failed', error);
    }
}
