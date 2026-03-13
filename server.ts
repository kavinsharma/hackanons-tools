// Custom server with built-in cron job
// Run with: npx ts-node --project tsconfig.server.json server.ts
// Or in production: node dist/server.js

import { createServer } from 'http';
import next from 'next';
import { startCronJob } from './src/lib/cron';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Start the cron job for periodic tracker updates
  startCronJob();

  createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Tracker page: http://${hostname}:${port}/torrent-trackers-list`);
    console.log(`> API: http://${hostname}:${port}/api/trackers`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
