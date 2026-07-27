import logger from '@/src/libs/logger';
import { renewSubscriptionsTick } from '@/src/services/subscription';

export async function subscriptionRenewal(): Promise<void> {
    const msg = 'CRON SUBSCRIPTION-RENEWAL ';
    try {
        const result = await renewSubscriptionsTick();
        if (result.renewed > 0 || result.failed > 0) {
            logger.info(msg + 'done', result);
        }
    } catch (error) {
        logger.error(msg + 'failed', error);
    }
}
