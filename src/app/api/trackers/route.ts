import { NextRequest, NextResponse } from 'next/server';
import { getTrackerData } from '@/lib/fetcher';

// API endpoint that returns tracker data as JSON
// Can be used by other tools or external consumers

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const format = searchParams.get('format') || 'json';

  const data = await getTrackerData();

  const validCategories = ['best', 'all', 'udp', 'http', 'https', 'ws'] as const;
  type Category = typeof validCategories[number];

  const cat: Category = validCategories.includes(category as Category)
    ? (category as Category)
    : 'all';

  const trackers = data[cat];

  // Return as plain text (one tracker per line, blank line separated)
  if (format === 'txt') {
    const text = trackers.map(t => t.url).join('\n\n') + '\n';
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=21600',
      },
    });
  }

  // Return as JSON
  return NextResponse.json({
    category: cat,
    count: trackers.length,
    lastUpdated: data.lastUpdated,
    trackers: trackers.map(t => t.url),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=21600',
    },
  });
}
