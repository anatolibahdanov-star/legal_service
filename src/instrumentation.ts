// instrumentation.ts
import cron from 'node-cron';
import { lostResponse } from './cron/lostResponse';
import { adminRating } from './cron/adminRating';
import { cleanupAuthAttemptsDb, cleanupOtpStoreMemory } from './cron/cleanupAuthAttempts';

export async function register() {
    console.log("process.env.NEXT_RUNTIME ", process.env.NEXT_RUNTIME)
  // Only run cron jobs in the server environment (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Registering scheduled tasks...');

    cron.schedule('*/5 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Search active lost User requests...`);
      await lostResponse()
    });

    cron.schedule('* * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Update Lawyers rating...`);
      await adminRating()
    });

    // OTP store in-memory prune — раз в час, чтобы Map не рос между рестартами
    cron.schedule('0 * * * *', () => {
      cleanupOtpStoreMemory();
    });

    // Housekeeping anti-bruteforce таблиц — раз в сутки в 3:00 ночи
    cron.schedule('0 3 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Cron job running: Cleanup auth_attempts...`);
      await cleanupAuthAttemptsDb();
    });
  }
}
