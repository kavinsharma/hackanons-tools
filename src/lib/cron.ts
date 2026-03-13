import cron from 'node-cron';
import { fetchAndUpdateTrackers } from './fetcher';
import { sendTelegramAlert, formatAlert } from './telegram';

let isRunning = false;

export function startCronJob() {
  // Run every 6 hours: at minute 0 of hours 0, 6, 12, 18
  cron.schedule('0 */6 * * *', async () => {
    if (isRunning) {
      console.log('[Cron] Previous job still running, skipping...');
      return;
    }

    isRunning = true;
    console.log('[Cron] Starting scheduled tracker update...');

    try {
      const data = await fetchAndUpdateTrackers();
      console.log(`[Cron] Update complete: ${data.totalCount} trackers`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Cron] Update failed:', msg);
      await sendTelegramAlert(formatAlert('error', 'Scheduled Cron', `Update failed: ${msg}`));
    } finally {
      isRunning = false;
    }
  });

  console.log('[Cron] Scheduled tracker updates every 6 hours');

  // Also run immediately on startup
  (async () => {
    console.log('[Cron] Running initial fetch on startup...');
    try {
      const data = await fetchAndUpdateTrackers();
      console.log(`[Cron] Initial fetch complete: ${data.totalCount} trackers`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Cron] Initial fetch failed:', msg);
      await sendTelegramAlert(formatAlert('error', 'Startup Fetch', `Initial fetch failed: ${msg}`));
    }
  })();
}
