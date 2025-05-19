/**
 * @file task_scheduler.js
 * @description Schedules recurring tasks using node-cron.
 */
import cron from 'node-cron';

/**
 * Schedules a recurring task.
 * @param {string} cron_expression - Cron expression for scheduling.
 * @param {Function} task - Function to execute.
 */
export function schedule_task(cron_expression, task) {
  cron.schedule(cron_expression, task);
}

// Example: Hourly OTP cleanup task.
schedule_task('0 * * * *', () => {
  console.log('Running hourly OTP cleanup task...');
  // TODO: Insert OTP cleanup logic here.
});