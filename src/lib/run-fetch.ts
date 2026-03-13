// Standalone script to fetch trackers manually
// Usage: npm run fetch

import { fetchAndUpdateTrackers } from './fetcher';

async function main() {
  console.log('Manually fetching tracker data...');
  const data = await fetchAndUpdateTrackers();
  console.log(`Done! ${data.totalCount} trackers saved.`);
  console.log(`Categories: best=${data.best.length}, all=${data.all.length}, udp=${data.udp.length}, http=${data.http.length}, https=${data.https.length}, ws=${data.ws.length}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fetch failed:', err);
  process.exit(1);
});
