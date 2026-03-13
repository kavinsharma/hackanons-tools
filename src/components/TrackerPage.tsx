'use client';

import { useState, useMemo } from 'react';
import { TrackerData, Tracker } from '@/lib/fetcher';
import TrackerTable from './TrackerTable';
import { AdUnit } from './AdSense';

type Category = 'best' | 'all' | 'udp' | 'http' | 'https' | 'ws';
type ViewMode = 'list' | 'table';

const TABS: { key: Category; label: string; icon: string }[] = [
  { key: 'best', label: 'Best', icon: '⭐' },
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'udp', label: 'UDP', icon: '🔵' },
  { key: 'http', label: 'HTTP', icon: '🟢' },
  { key: 'https', label: 'HTTPS', icon: '🔒' },
  { key: 'ws', label: 'WebSocket', icon: '🌐' },
];

const PROTOCOL_COLORS: Record<string, string> = {
  udp: 'text-blue-400',
  http: 'text-emerald-400',
  https: 'text-violet-400',
  ws: 'text-amber-400',
  wss: 'text-amber-400',
  unknown: 'text-gray-400',
};

interface Props {
  data: TrackerData;
}

export default function TrackerPage({ data }: Props) {
  const [activeTab, setActiveTab] = useState<Category>('best');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [blankLines, setBlankLines] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const trackers = data[activeTab] as Tracker[];

  const filtered = useMemo(() => {
    if (!search.trim()) return trackers;
    const term = search.toLowerCase();
    return trackers.filter(t => t.url.toLowerCase().includes(term));
  }, [trackers, search]);

  const trackerText = useMemo(() => {
    return filtered.map(t => t.url).join(blankLines ? '\n\n' : '\n');
  }, [filtered, blankLines]);

  // Filter details to match current category
  const filteredDetails = useMemo(() => {
    if (!data.details?.length) return [];
    const categoryUrls = new Set(trackers.map(t => t.url));
    return data.details.filter(d => categoryUrls.has(d.url));
  }, [data.details, trackers]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(trackerText);
      setCopied(true);
      showToast(`${filtered.length} trackers copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy. Please select and copy manually.');
    }
  }

  async function copySingle(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Tracker copied!');
    } catch {
      /* ignore */
    }
  }

  function download() {
    const text = trackerText + '\n';
    const filename = `trackers_${activeTab}_${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  }

  const lastUpdated = new Date(data.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasDetails = data.details && data.details.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Ad Slot: Top Banner */}
      <div className="w-full border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <AdUnit slot="TOP_BANNER_SLOT" format="auto" className="min-h-[90px]" />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gray-50 dark:bg-[#1a1b2e] border-b border-gray-200 dark:border-gray-800 py-12 md:py-16 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full text-sm font-semibold mb-5">
            Updated Every 6 Hours &bull; {lastUpdated}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Torrent Tracker List <span className="text-indigo-600 dark:text-indigo-400">2026</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
            The most comprehensive, daily-updated list of <strong className="text-gray-900 dark:text-gray-200">working public BitTorrent trackers</strong>. One-click copy, categorized by protocol, and ready to paste into any torrent client.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
            {[
              { value: data.all.length, label: 'Total Trackers' },
              { value: data.udp.length, label: 'UDP Trackers' },
              { value: data.http.length + data.https.length, label: 'HTTP/S Trackers' },
              { value: data.best.length, label: 'Top Rated' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl md:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">{stat.value}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* Main Column */}
          <div className="min-w-0">
            {/* Unified Tracker Section */}
            <section id="tracker-lists">
              <h2 className="text-2xl font-bold mb-2">Quick Copy Tracker Lists</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Select a category and copy all trackers instantly. Separated by blank lines for compatibility with all torrent clients.
              </p>

              {/* Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                      activeTab === tab.key
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${
                      activeTab === tab.key
                        ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {(data[tab.key] as Tracker[]).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Action Bar */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter trackers..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1117] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyAll}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                      copied
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        Copy All
                      </>
                    )}
                  </button>
                  <button
                    onClick={download}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download .txt
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    viewMode === 'list'
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                      : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  List View
                </button>

                {hasDetails && (
                  <button
                    onClick={() => setViewMode('table')}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      viewMode === 'table'
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    Detailed View
                    {/* Glow badge */}
                    {viewMode !== 'table' && (
                      <span className="relative flex items-center">
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white uppercase tracking-wide">
                          Live
                        </span>
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* === LIST VIEW === */}
              {viewMode === 'list' && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 font-medium flex-wrap gap-2">
                    <span>
                      {search
                        ? `${filtered.length} of ${trackers.length} trackers`
                        : `${trackers.length} trackers`}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={blankLines}
                        onChange={e => setBlankLines(e.target.checked)}
                        className="accent-indigo-600 w-3.5 h-3.5"
                      />
                      Blank lines between trackers
                    </label>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto bg-[#1a1b2e] scrollbar-thin">
                    <pre className="p-4 text-[13px] leading-relaxed font-mono">
                      {filtered.length > 0 ? (
                        filtered.map((tracker, i) => (
                          <span key={tracker.url}>
                            <span
                              onClick={() => copySingle(tracker.url)}
                              className={`block px-2 py-0.5 rounded cursor-pointer hover:bg-white/5 transition-colors ${PROTOCOL_COLORS[tracker.protocol]}`}
                              title="Click to copy this tracker"
                            >
                              {tracker.url}
                            </span>
                            {blankLines && i < filtered.length - 1 ? '\n' : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">
                          {search ? 'No trackers match your filter.' : 'No trackers available.'}
                        </span>
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* === TABLE VIEW === */}
              {viewMode === 'table' && hasDetails && (
                <TrackerTable details={filteredDetails} />
              )}

              {/* SEO: Render tracker URLs as hidden text for crawlers */}
              <noscript>
                <div>
                  <h3>All Tracker URLs</h3>
                  {data.all.map(t => (
                    <p key={t.url}>{t.url}</p>
                  ))}
                </div>
              </noscript>
            </section>

            {/* Ad Slot: Mid Content */}
            <div className="my-10">
              <AdUnit slot="MID_CONTENT_SLOT" format="rectangle" className="min-h-[250px]" />
            </div>

            {/* How To Use */}
            <section id="how-to-use" className="mt-12">
              <h2 className="text-2xl font-bold mb-2">How to Add Trackers to Your Torrent Client</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Adding trackers is simple and works with all major torrent clients.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'qBittorrent',
                    steps: [
                      'Copy the tracker list using the <strong>Copy All</strong> button above',
                      'Right-click on your torrent in qBittorrent',
                      'Select <strong>Trackers</strong> → <strong>Edit trackers</strong>',
                      'Paste the trackers at the bottom of the list',
                      'Click <strong>OK</strong> to save',
                    ],
                    tip: 'Go to Options → BitTorrent and paste trackers under "Automatically add these trackers to new downloads" for automatic addition.',
                  },
                  {
                    name: 'uTorrent / BitTorrent',
                    steps: [
                      'Copy the tracker list using the <strong>Copy All</strong> button',
                      'Right-click on your torrent',
                      'Select <strong>Properties</strong>',
                      'Paste trackers in the <strong>Trackers</strong> field',
                      'Click <strong>OK</strong>',
                    ],
                  },
                  {
                    name: 'Transmission',
                    steps: [
                      'Open Transmission and select your torrent',
                      'Click the <strong>Inspector</strong> button (i icon)',
                      'Go to the <strong>Trackers</strong> tab',
                      'Click <strong>Add</strong> and paste trackers one by one',
                    ],
                  },
                  {
                    name: 'Vuze / Deluge',
                    steps: [
                      'Right-click on your torrent',
                      'Select <strong>Edit Trackers</strong> (Vuze) or <strong>Trackers</strong> tab (Deluge)',
                      'Add or paste the tracker URLs',
                      'Save changes',
                    ],
                  },
                ].map(client => (
                  <div key={client.name} className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-base mb-3">{client.name}</h3>
                    <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                      {client.steps.map((step, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                      ))}
                    </ol>
                    {client.tip && (
                      <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                        <strong>Pro tip:</strong> {client.tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Ad Slot: Before FAQ */}
            <div className="my-10">
              <AdUnit slot="BEFORE_FAQ_SLOT" format="auto" className="min-h-[100px]" />
            </div>

            {/* Info Section */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-4">What Are Torrent Trackers and Why Do You Need Them?</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                <p>
                  A <strong>torrent tracker</strong> is a special server that assists in the communication between peers using the BitTorrent protocol. Think of it as a coordinator that keeps track of which users (peers) have which pieces of a file, connecting downloaders (leechers) with uploaders (seeders).
                </p>

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">How Torrent Trackers Improve Download Speed</h3>
                <p>
                  When you add more trackers to a torrent, your client can discover more peers who have the file you want. More peers mean more sources to download from simultaneously, which directly translates to <strong>faster download speeds</strong>. Users commonly report speed improvements of 2x to 5x after adding additional trackers.
                </p>

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">Types of Torrent Trackers</h3>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li><strong>UDP Trackers</strong> — Fastest and most efficient. Uses the UDP protocol which has lower overhead than TCP.</li>
                  <li><strong>HTTP/HTTPS Trackers</strong> — More compatible across networks and firewalls. HTTPS adds encryption for privacy.</li>
                  <li><strong>WebSocket (WS) Trackers</strong> — Used primarily by web-based torrent clients like WebTorrent.</li>
                </ul>

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">Public vs Private Trackers</h3>
                <p>
                  All trackers listed on this page are <strong>public trackers</strong> — they&apos;re free to use and don&apos;t require registration. Private trackers require an invitation and account but often have better-maintained content and faster speeds.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mt-12">
              <h2 className="text-2xl font-bold mb-5">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {[
                  {
                    q: 'What is a torrent tracker?',
                    a: 'A torrent tracker is a server that helps coordinate the transfer of files between peers using the BitTorrent protocol. It keeps track of which peers have which pieces of a file, connecting downloaders (leechers) with uploaders (seeders) to facilitate faster downloads.',
                  },
                  {
                    q: 'How do I add trackers to my torrent client?',
                    a: 'Copy the tracker list using the "Copy All" button, then in your torrent client (uTorrent, qBittorrent, Transmission, etc.), right-click on a torrent, select Properties or Edit Trackers, and paste the tracker URLs. Each tracker should be on a separate line with a blank line between them.',
                  },
                  {
                    q: 'How often is this tracker list updated?',
                    a: 'Our tracker list is automatically updated every 6 hours. We source data from newTrackon (live monitoring with uptime tracking) and ngosang/trackerslist (community curated). This ensures you always have the most current and working trackers.',
                  },
                  {
                    q: 'Will adding more trackers increase my download speed?',
                    a: 'Yes! Adding more trackers helps your torrent client discover more peers who have the file you want. More peers means more simultaneous connections, which directly translates to faster download speeds. Users commonly report 2-5x speed improvements.',
                  },
                  {
                    q: 'Are these trackers safe to use?',
                    a: "These are all public trackers that are widely used by the BitTorrent community. They simply help coordinate peer connections — they don't host or distribute any content themselves. For additional privacy, consider using a VPN while torrenting.",
                  },
                  {
                    q: "What's the difference between UDP and HTTP trackers?",
                    a: 'UDP trackers are faster and more efficient because they use a lighter-weight protocol with less overhead. HTTP/HTTPS trackers are more compatible with firewalls and restrictive networks. HTTPS trackers add encryption. For best results, include both types.',
                  },
                  {
                    q: 'Why do some trackers show as "not working"?',
                    a: "Trackers can go offline temporarily for maintenance, get overloaded, or be blocked by your ISP/network. Our 6-hour update process removes consistently dead trackers and adds new working ones. If a tracker shows as not working, it may simply be temporarily unavailable.",
                  },
                  {
                    q: 'Should I use the "Best" or "All" tracker list?',
                    a: 'The "Best" list contains the most reliable and fastest trackers with 95%+ uptime — ideal for most users. The "All" list includes every working tracker for maximum peer discovery. Start with "Best" and use "All" if you need more seeds for rare or old torrents.',
                  },
                ].map(faq => (
                  <details key={faq.q} className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer font-semibold text-sm select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {faq.q}
                      <span className="text-gray-400 text-lg group-open:rotate-45 transition-transform flex-shrink-0">+</span>
                    </summary>
                    <p className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-20">
            {/* Ad Slot: Sidebar Top */}
            <AdUnit slot="SIDEBAR_TOP_SLOT" format="rectangle" className="min-h-[250px]" />

            {/* Quick Info */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="font-bold text-sm mb-4">Quick Info</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {[
                  { icon: '🔄', text: 'Updated <strong>every 6 hours</strong> automatically' },
                  { icon: '✅', text: 'Only <strong>working</strong> trackers included' },
                  { icon: '📊', text: 'Sorted by <strong>speed & reliability</strong>' },
                  { icon: '🆓', text: 'All trackers are <strong>public & free</strong>' },
                  { icon: '🛡️', text: 'Data from <strong>2 verified sources</strong>' },
                ].map(item => (
                  <li key={item.icon} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Supported Clients */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="font-bold text-sm mb-4">Supported Clients</h3>
              <div className="flex flex-wrap gap-1.5">
                {['qBittorrent', 'uTorrent', 'BitTorrent', 'Transmission', 'Deluge', 'Vuze', 'Tixati', 'BiglyBT', 'LibreTorrent', 'WebTorrent'].map(client => (
                  <span key={client} className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                    {client}
                  </span>
                ))}
              </div>
            </div>

            {/* API Info */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="font-bold text-sm mb-4">API Access</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Access tracker data programmatically:
              </p>
              <div className="space-y-2">
                <code className="block text-[11px] bg-[#1a1b2e] text-indigo-300 p-2 rounded overflow-x-auto">
                  GET /api/trackers?category=best
                </code>
                <code className="block text-[11px] bg-[#1a1b2e] text-emerald-300 p-2 rounded overflow-x-auto">
                  GET /api/trackers?format=txt
                </code>
              </div>
            </div>

            {/* Ad Slot: Sidebar Sticky */}
            <AdUnit slot="SIDEBAR_STICKY_SLOT" format="vertical" className="min-h-[600px]" />
          </aside>
        </div>
      </main>

      {/* Ad Slot: Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <AdUnit slot="BOTTOM_BANNER_SLOT" format="auto" className="min-h-[90px]" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-[#1a1b2e] border-t border-gray-200 dark:border-gray-800 py-10 mt-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div>
              <p className="font-bold text-base">HackAnons Tools</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 max-w-md">
                Free, open-source tools for the internet community. Tracker data sourced from{' '}
                <a href="https://newtrackon.com" target="_blank" rel="noopener" className="text-indigo-600 dark:text-indigo-400 hover:underline">newTrackon</a>
                {' & '}
                <a href="https://github.com/ngosang/trackerslist" target="_blank" rel="noopener" className="text-indigo-600 dark:text-indigo-400 hover:underline">ngosang/trackerslist</a>.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="https://tools.hackanons.com" className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Tools</a>
              <a href="#tracker-lists" className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Trackers</a>
              <a href="#faq" className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a>
            </div>
          </div>
          <div className="pt-5 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400">&copy; 2026 HackAnons. This page does not host or distribute any copyrighted content.</p>
          </div>
        </div>
      </footer>

      {/* Toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 pointer-events-none ${
          toast
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0'
        } bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 dark:text-emerald-600">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {toast}
      </div>
    </div>
  );
}
