// instrumentation.ts
import cron from 'node-cron';
import { lostResponse } from './cron/lostResponse';
import { adminRating } from './cron/adminRating';
import { cleanupAuthAttemptsDb, cleanupOtpStoreMemory } from './cron/cleanupAuthAttempts';
import { unpaidReminder } from './cron/unpaidReminder';
import { paymentRetry } from './cron/paymentRetry';
import { expireSubscriptions } from './cron/expireSubscriptions';
import { subscriptionRenewal } from './cron/subscriptionRenewal';
import { warmSettings } from './services/settings';
import { seedPromptVersionIfEmpty } from './repositories/settings/repo';
import logger from './libs/logger';

export async function register() {
    console.log("process.env.NEXT_RUNTIME ", process.env.NEXT_RUNTIME)
  // Only run cron jobs in the server environment (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const tls = await import('tls');
      const { Agent, setGlobalDispatcher } = await import('undici');
      const caPath = path.join(process.cwd(), 'certs/russian_trusted_bundle.pem');
      const ca = [...tls.rootCertificates, fs.readFileSync(caPath, 'utf-8')];
      setGlobalDispatcher(new Agent({ connect: { ca } }));
      logger.info('INSTRUMENTATION register - Russian trusted CA enabled for outbound TLS');
    } catch (e) {
      logger.error('INSTRUMENTATION register - Failed to enable Russian trusted CA, falling back to NODE_EXTRA_CA_CERTS', (e as Error).message);
    }

    await warmSettings();

    try {
      const fs = await import('fs');
      const path = await import('path');
      const promptPath = path.join(process.cwd(), 'src/libs/Promt_8.1_2604_v2.md');
      const body = fs.readFileSync(promptPath, 'utf-8');
      await seedPromptVersionIfEmpty('grok_answer', 'Базовая версия (Promt 8.1)', body);
    } catch (e) {
      console.error('Failed to seed initial prompt version', e);
    }

    console.log('Registering scheduled tasks...');

    cron.schedule('*/5 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Search active lost User requests...`);
      await lostResponse()
    });

    cron.schedule('* * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Update Lawyers rating...`);
      await adminRating()
    });

    // Unpaid-question payment reminder — gated by unpaid_reminder_enabled in settings.
    cron.schedule('0 9 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Unpaid question payment reminder...`);
      await unpaidReminder();
    });

    // OTP store in-memory prune — once per hour to keep the Map from growing between restarts
    cron.schedule('0 * * * *', () => {
      cleanupOtpStoreMemory();
    });

    // Housekeeping for anti-bruteforce tables — daily at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Cleanup auth_attempts...`);
      await cleanupAuthAttemptsDb();
    });

    // Subscription expiry — flip lapsed subscriptions to Expired and burn their БВ.
    cron.schedule('*/10 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Expire subscriptions...`);
      await expireSubscriptions();
    });

    // Subscription auto-renewal — recurring card-binding charge before period_end.
    cron.schedule('0 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Subscription auto-renewal...`);
      await subscriptionRenewal();
    });

    // Payment reconcile — poll Alfa for pending orders that never confirmed via the browser.
    cron.schedule('*/5 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Payment retry reconcile...`);
      await paymentRetry();
    });
  }
}
