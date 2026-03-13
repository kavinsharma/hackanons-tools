import { NextRequest, NextResponse } from 'next/server';
import { fetchAndUpdateTrackers } from '@/lib/fetcher';
import { sendTelegramAlert, formatAlert } from '@/lib/telegram';

// This endpoint is called by an external cron service (e.g., cron-job.org, Vercel Cron, or system crontab)
// Protected by CRON_SECRET to prevent unauthorized access

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && expectedSecret !== 'your_random_secret_here' && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await fetchAndUpdateTrackers();

    return NextResponse.json({
      success: true,
      totalCount: data.totalCount,
      categories: {
        best: data.best.length,
        all: data.all.length,
        udp: data.udp.length,
        http: data.http.length,
        https: data.https.length,
        ws: data.ws.length,
      },
      lastUpdated: data.lastUpdated,
      source: data.source,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Cron] Failed:', msg);
    await sendTelegramAlert(formatAlert('error', 'Cron Job', `Update failed: ${msg}`));

    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
