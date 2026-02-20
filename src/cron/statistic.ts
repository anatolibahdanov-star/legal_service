import cron from 'node-cron'; // or use require if preferred

// Define the function to be executed by the cron job
const runScheduledTask = async () => {
  try {
    console.log(`[${new Date().toISOString()}] Running a scheduled task...`);
    // Add your specific business logic here, e.g., database backups, sending emails, etc.
    // Example: await sendDailyReport();
    console.log(`[${new Date().toISOString()}] Task completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in cron job:`, error);
  }
};

// Schedule the task to run every minute
// The cron expression '* * * * *' means "every minute"
cron.schedule('* * * * *', () => {
  runScheduledTask();
});

console.log('Cron job scheduled. Waiting for execution...');
