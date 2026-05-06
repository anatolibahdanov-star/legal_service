// instrumentation.ts
import cron from 'node-cron';
import { lostResponse } from './cron/lostResponse';
import { adminRating } from './cron/adminRating';

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

    // Example: Run a daily report at 8:00 AM
    // cron.schedule('0 8 * * *', () => {
    //   console.log('Sending daily summary report...');
    // });
  }
}
