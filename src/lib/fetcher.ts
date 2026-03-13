import { sendTelegramAlert, formatAlert } from './telegram';
import fs from 'fs/promises';
import path from 'path';

// ============================================
// Types
// ============================================
export interface TrackerDetails {
  url: string;
  protocol: 'udp' | 'http' | 'https' | 'ws' | 'wss' | 'unknown';
  uptime: number | null;       // e.g. 99.5
  uptimeStr: string;           // e.g. "99.50%"
  status: 'up' | 'down' | 'unknown';
  statusDuration: string;      // e.g. "4 months"
  latency: number | null;      // ms
  latencyStr: string;          // e.g. "56 ms"
  country: string;             // e.g. "Norway"
  countryCode: string;         // e.g. "no"
  network: string;             // e.g. "Gigahost AS"
  ip: string[];                // IPv4 + IPv6
  added: string;               // e.g. "28-11-2016"
}

export interface Tracker {
  url: string;
  protocol: 'udp' | 'http' | 'https' | 'ws' | 'wss' | 'unknown';
}

export interface TrackerData {
  best: Tracker[];
  all: Tracker[];
  udp: Tracker[];
  http: Tracker[];
  https: Tracker[];
  ws: Tracker[];
  details: TrackerDetails[];   // Rich data from newTrackon
  lastUpdated: string;
  source: string;
  totalCount: number;
}

// ============================================
// Sources
// ============================================
const NEWTRACKON_URL = 'https://newtrackon.com/';
const NEWTRACKON_API = 'https://newtrackon.com/api';
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/';
const GITHUB_RAW = 'https://raw.githubusercontent.com/ngosang/trackerslist/master/';

const NGOSANG_FILES: Record<string, string> = {
  best: 'trackers_best.txt',
  all: 'trackers_all.txt',
  udp: 'trackers_all_udp.txt',
  http: 'trackers_all_http.txt',
  https: 'trackers_all_https.txt',
  ws: 'trackers_all_ws.txt',
};

const DATA_FILE = path.join(process.cwd(), 'data', 'trackers.json');
const FETCH_TIMEOUT = 20000;

// ============================================
// Fetch with timeout
// ============================================
async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================
// Parse protocol from URL
// ============================================
function getProtocol(url: string): Tracker['protocol'] {
  if (url.startsWith('udp://')) return 'udp';
  if (url.startsWith('https://')) return 'https';
  if (url.startsWith('http://')) return 'http';
  if (url.startsWith('wss://')) return 'wss';
  if (url.startsWith('ws://')) return 'ws';
  return 'unknown';
}

// ============================================
// Parse raw text into tracker array
// ============================================
function parseTrackerList(text: string): Tracker[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes('://'))
    .map(url => ({ url, protocol: getProtocol(url) }));
}

// ============================================
// Scrape newTrackon HTML for rich tracker data
// ============================================
async function scrapeNewTrackonDetails(): Promise<TrackerDetails[]> {
  try {
    const response = await fetchWithTimeout(NEWTRACKON_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();
    return parseNewTrackonHTML(html);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Fetcher] newTrackon HTML scrape failed:`, msg);
    await sendTelegramAlert(formatAlert('error', 'newTrackon HTML Scrape', msg));
    return [];
  }
}

function parseNewTrackonHTML(html: string): TrackerDetails[] {
  const trackers: TrackerDetails[] = [];

  // Match each table row: from <tr> to </tr>
  const rowRegex = /<tr>\s*<td>([\s\S]*?)<\/tr>/g;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = '<td>' + match[1];

    // Extract all <td> contents
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(tdMatch[1]);
    }

    if (cells.length < 10) continue;

    // Cell 0: Tracker URL
    const url = stripHtml(cells[0]).trim();
    if (!url.includes('://')) continue;

    // Cell 1: Uptime %
    const uptimeStr = stripHtml(cells[1]).trim();
    const uptimeNum = parseFloat(uptimeStr);

    // Cell 2: Status
    let status: 'up' | 'down' | 'unknown' = 'unknown';
    let statusDuration = '';
    if (cells[2].includes('Working')) {
      status = 'up';
      const durMatch = cells[2].match(/Working for (.*?)</);
      statusDuration = durMatch ? durMatch[1].trim() : '';
    } else if (cells[2].includes('Down')) {
      status = 'down';
      const durMatch = cells[2].match(/Down for (.*?)</);
      statusDuration = durMatch ? durMatch[1].trim() : '';
    }

    // Cell 3: Checked (skip - relative time)
    // Cell 4: Update interval (skip)

    // Cell 5: IP addresses
    const ipRaw = cells[5].replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '');
    const ips = ipRaw.split('\n').map(s => s.trim()).filter(Boolean);

    // Cell 6: Country (with flag class)
    let country = '';
    let countryCode = '';
    const countryFlagMatch = cells[6].match(/fi-(\w+)/);
    if (countryFlagMatch) {
      countryCode = countryFlagMatch[1];
    }
    const countryNameMatch = cells[6].match(/<\/span>\s*([\w\s]+)/);
    if (countryNameMatch) {
      country = countryNameMatch[1].trim();
    }

    // Cell 7: Network
    const network = stripHtml(cells[7]).replace(/\s+/g, ' ').trim();

    // Cell 8: Latency
    const latencyStr = stripHtml(cells[8]).trim();
    const latencyMatch = latencyStr.match(/(\d+)/);
    const latencyNum = latencyMatch ? parseInt(latencyMatch[1]) : null;

    // Cell 9: Added date
    const added = stripHtml(cells[9]).trim();

    trackers.push({
      url,
      protocol: getProtocol(url),
      uptime: isNaN(uptimeNum) ? null : uptimeNum,
      uptimeStr,
      status,
      statusDuration,
      latency: latencyNum,
      latencyStr,
      country,
      countryCode,
      network,
      ip: ips,
      added,
    });
  }

  console.log(`[Fetcher] newTrackon HTML: parsed ${trackers.length} trackers with rich data`);
  return trackers;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

// ============================================
// Fetch from newTrackon API (plain text lists)
// ============================================
async function fetchNewTrackon(): Promise<Tracker[]> {
  const endpoints = [
    { url: `${NEWTRACKON_API}/stable`, label: 'stable (95%+ uptime)' },
    { url: `${NEWTRACKON_API}/live`, label: 'live (currently online)' },
  ];

  const allTrackers: Map<string, Tracker> = new Map();

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      const trackers = parseTrackerList(text);
      trackers.forEach(t => allTrackers.set(t.url, t));
      console.log(`[Fetcher] newTrackon ${endpoint.label}: ${trackers.length} trackers`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Fetcher] newTrackon ${endpoint.label} failed:`, msg);
      await sendTelegramAlert(formatAlert('error', `newTrackon API (${endpoint.label})`, msg));
    }
  }

  return Array.from(allTrackers.values());
}

// ============================================
// Fetch from ngosang/trackerslist
// ============================================
async function fetchNgosangFile(category: string, filename: string): Promise<Tracker[]> {
  const urls = [CDN_BASE + filename, GITHUB_RAW + filename];

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        const text = await response.text();
        const trackers = parseTrackerList(text);
        console.log(`[Fetcher] ngosang ${category}: ${trackers.length} trackers from ${url}`);
        return trackers;
      }
    } catch {
      continue;
    }
  }

  const msg = `Both CDN and GitHub raw failed for ${filename}`;
  console.error(`[Fetcher] ngosang ${category}: ${msg}`);
  await sendTelegramAlert(formatAlert('error', `ngosang/${filename}`, msg));
  return [];
}

// ============================================
// Merge & deduplicate
// ============================================
function mergeTrackers(
  newTrackon: Tracker[],
  ngosang: Record<string, Tracker[]>,
  details: TrackerDetails[]
): TrackerData {
  const masterSet = new Map<string, Tracker>();
  ngosang.all?.forEach(t => masterSet.set(t.url, t));
  newTrackon.forEach(t => masterSet.set(t.url, t));
  // Also add any trackers from the HTML scrape that weren't in the API
  details.forEach(d => {
    if (!masterSet.has(d.url)) {
      masterSet.set(d.url, { url: d.url, protocol: d.protocol });
    }
  });

  const allTrackers = Array.from(masterSet.values());

  const categorize = (trackers: Tracker[], protocol?: string) =>
    protocol ? trackers.filter(t => t.protocol === protocol) : trackers;

  const bestUrls = new Set(newTrackon.map(t => t.url));
  ngosang.best?.forEach(t => bestUrls.add(t.url));
  const best = allTrackers.filter(t => bestUrls.has(t.url));

  return {
    best,
    all: allTrackers,
    udp: categorize(allTrackers, 'udp'),
    http: categorize(allTrackers, 'http'),
    https: categorize(allTrackers, 'https'),
    ws: [...categorize(allTrackers, 'ws'), ...categorize(allTrackers, 'wss')],
    details,
    lastUpdated: new Date().toISOString(),
    source: 'newtrackon + ngosang/trackerslist',
    totalCount: allTrackers.length,
  };
}

// ============================================
// Main fetch function
// ============================================
export async function fetchAndUpdateTrackers(): Promise<TrackerData> {
  console.log('[Fetcher] Starting tracker update...');
  const startTime = Date.now();

  // Fetch from all three sources in parallel
  const [newTrackonTrackers, ngosangResults, details] = await Promise.all([
    fetchNewTrackon(),
    (async () => {
      const results: Record<string, Tracker[]> = {};
      await Promise.all(
        Object.entries(NGOSANG_FILES).map(async ([category, filename]) => {
          results[category] = await fetchNgosangFile(category, filename);
        })
      );
      return results;
    })(),
    scrapeNewTrackonDetails(),
  ]);

  const totalNewTrackon = newTrackonTrackers.length;
  const totalNgosang = ngosangResults.all?.length || 0;

  if (totalNewTrackon === 0 && totalNgosang === 0 && details.length === 0) {
    const msg = 'All sources returned 0 trackers. Using cached data.';
    console.error(`[Fetcher] CRITICAL: ${msg}`);
    await sendTelegramAlert(formatAlert('error', 'All Sources', msg));

    const cached = await loadCachedData();
    if (cached) return cached;

    return {
      best: [], all: [], udp: [], http: [], https: [], ws: [], details: [],
      lastUpdated: new Date().toISOString(),
      source: 'none - all sources failed',
      totalCount: 0,
    };
  }

  if (totalNewTrackon === 0) {
    await sendTelegramAlert(
      formatAlert('warning', 'newTrackon API', `Returned 0 trackers. Using ngosang only (${totalNgosang} trackers).`)
    );
  }
  if (totalNgosang === 0) {
    await sendTelegramAlert(
      formatAlert('warning', 'ngosang/trackerslist', `Returned 0 trackers. Using newTrackon only (${totalNewTrackon} trackers).`)
    );
  }

  const data = mergeTrackers(newTrackonTrackers, ngosangResults, details);
  await saveCachedData(data);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Fetcher] Update complete: ${data.totalCount} trackers (${details.length} with rich data) in ${elapsed}s`);

  return data;
}

// ============================================
// Cache management
// ============================================
async function saveCachedData(data: TrackerData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`[Fetcher] Data cached to ${DATA_FILE}`);
  } catch (error) {
    console.error('[Fetcher] Failed to save cache:', error);
  }
}

export async function loadCachedData(): Promise<TrackerData | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as TrackerData;
  } catch {
    return null;
  }
}

export async function getTrackerData(): Promise<TrackerData> {
  const cached = await loadCachedData();
  if (cached) {
    const age = Date.now() - new Date(cached.lastUpdated).getTime();
    const twelveHours = 12 * 60 * 60 * 1000;
    if (age < twelveHours) {
      console.log('[Fetcher] Using cached data (age: ' + Math.round(age / 60000) + ' min)');
      return cached;
    }
  }
  return fetchAndUpdateTrackers();
}
