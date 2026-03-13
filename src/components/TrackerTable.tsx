'use client';

import { useState, useMemo } from 'react';
import { TrackerDetails } from '@/lib/fetcher';

type SortKey = 'url' | 'uptime' | 'status' | 'latency' | 'country' | 'network' | 'added';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'up' | 'down';

const PAGE_SIZES = [25, 50, 100];

// Country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Uptime color
function uptimeColor(uptime: number | null): string {
  if (uptime === null) return 'text-gray-400';
  if (uptime >= 99) return 'text-emerald-500';
  if (uptime >= 95) return 'text-green-500';
  if (uptime >= 80) return 'text-yellow-500';
  if (uptime >= 50) return 'text-orange-500';
  return 'text-red-500';
}

// Uptime bar width
function uptimeBarWidth(uptime: number | null): string {
  if (uptime === null) return '0%';
  return `${Math.min(uptime, 100)}%`;
}

function uptimeBarColor(uptime: number | null): string {
  if (uptime === null) return 'bg-gray-300 dark:bg-gray-700';
  if (uptime >= 99) return 'bg-emerald-500';
  if (uptime >= 95) return 'bg-green-500';
  if (uptime >= 80) return 'bg-yellow-500';
  if (uptime >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

// Latency color
function latencyColor(latency: number | null): string {
  if (latency === null) return 'text-gray-400';
  if (latency <= 50) return 'text-emerald-500';
  if (latency <= 100) return 'text-green-500';
  if (latency <= 200) return 'text-yellow-500';
  if (latency <= 500) return 'text-orange-500';
  return 'text-red-500';
}

// Protocol badge
function protocolBadge(protocol: string): { bg: string; text: string } {
  switch (protocol) {
    case 'udp': return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' };
    case 'http': return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'https': return { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300' };
    case 'ws': case 'wss': return { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' };
    default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
  }
}

// Parse "28-11-2016" to sortable number
function parseDate(dateStr: string): number {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`).getTime() || 0;
  }
  return 0;
}

interface Props {
  details: TrackerDetails[];
}

export default function TrackerTable({ details }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('uptime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function copySingle(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Tracker URL copied!');
    } catch { /* */ }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'url' ? 'asc' : 'desc');
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    let list = details;

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }

    // Protocol filter
    if (protocolFilter !== 'all') {
      list = list.filter(t => t.protocol === protocolFilter);
    }

    // Search
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(t =>
        t.url.toLowerCase().includes(term) ||
        t.country.toLowerCase().includes(term) ||
        t.network.toLowerCase().includes(term) ||
        t.ip.some(ip => ip.includes(term))
      );
    }

    return list;
  }, [details, statusFilter, protocolFilter, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      switch (sortKey) {
        case 'url': return dir * a.url.localeCompare(b.url);
        case 'uptime': return dir * ((a.uptime ?? -1) - (b.uptime ?? -1));
        case 'status': {
          const statusOrder = { up: 2, unknown: 1, down: 0 };
          return dir * (statusOrder[a.status] - statusOrder[b.status]);
        }
        case 'latency': return dir * ((a.latency ?? 99999) - (b.latency ?? 99999));
        case 'country': return dir * a.country.localeCompare(b.country);
        case 'network': return dir * a.network.localeCompare(b.network);
        case 'added': return dir * (parseDate(a.added) - parseDate(b.added));
        default: return 0;
      }
    });

    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const upCount = details.filter(t => t.status === 'up').length;
  const downCount = details.filter(t => t.status === 'down').length;

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span className={`ml-1 inline-block transition-transform ${active ? 'opacity-100' : 'opacity-30'}`}>
      {active && dir === 'desc' ? '↓' : '↑'}
    </span>
  );

  function ThCell({ label, sortBy, className = '' }: { label: string; sortBy: SortKey; className?: string }) {
    return (
      <th
        className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap ${className}`}
        onClick={() => toggleSort(sortBy)}
      >
        {label}
        <SortIcon active={sortKey === sortBy} dir={sortDir} />
      </th>
    );
  }

  return (
    <div id="tracker-database">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{details.length}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Total Tracked</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-500">{upCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Online</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-red-500">{downCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Offline</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-amber-500">
            {details.length > 0 ? ((upCount / details.length) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">Health Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search URL, country, network, IP..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1117] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {([
            { key: 'all', label: 'All', count: details.length },
            { key: 'up', label: 'Online', count: upCount },
            { key: 'down', label: 'Offline', count: downCount },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(0); }}
              className={`px-3 py-2 font-medium transition-colors ${
                statusFilter === f.key
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f.label}
              <span className="ml-1 text-xs opacity-60">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Protocol filter */}
        <select
          value={protocolFilter}
          onChange={e => { setProtocolFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
        >
          <option value="all">All Protocols</option>
          <option value="udp">UDP</option>
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="ws">WebSocket</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <ThCell label="Tracker" sortBy="url" />
                <ThCell label="Uptime" sortBy="uptime" />
                <ThCell label="Status" sortBy="status" />
                <ThCell label="Latency" sortBy="latency" />
                <ThCell label="Country" sortBy="country" />
                <ThCell label="Network" sortBy="network" />
                <ThCell label="Added" sortBy="added" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((tracker) => {
                const badge = protocolBadge(tracker.protocol);
                return (
                  <tr
                    key={tracker.url}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    {/* URL */}
                    <td className="px-3 py-3 max-w-[340px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                          {tracker.protocol}
                        </span>
                        <button
                          onClick={() => copySingle(tracker.url)}
                          className="font-mono text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 truncate text-left transition-colors"
                          title={`Click to copy: ${tracker.url}`}
                        >
                          {tracker.url.replace(/^(udp|https?|wss?):\/\//, '')}
                        </button>
                        <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                    </td>

                    {/* Uptime */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${uptimeBarColor(tracker.uptime)}`}
                            style={{ width: uptimeBarWidth(tracker.uptime) }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${uptimeColor(tracker.uptime)}`}>
                          {tracker.uptimeStr || '--'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {tracker.status === 'up' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Up {tracker.statusDuration && <span className="text-gray-400 dark:text-gray-500 font-normal">({tracker.statusDuration})</span>}
                          </span>
                        </div>
                      ) : tracker.status === 'down' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-medium text-red-500 dark:text-red-400">
                            Down {tracker.statusDuration && <span className="text-gray-400 dark:text-gray-500 font-normal">({tracker.statusDuration})</span>}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unknown</span>
                      )}
                    </td>

                    {/* Latency */}
                    <td className={`px-3 py-3 whitespace-nowrap text-xs font-semibold tabular-nums ${latencyColor(tracker.latency)}`}>
                      {tracker.latencyStr || '--'}
                    </td>

                    {/* Country */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {tracker.countryCode && (
                          <span className="text-base leading-none">{countryFlag(tracker.countryCode)}</span>
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400">{tracker.country || '--'}</span>
                      </div>
                    </td>

                    {/* Network */}
                    <td className="px-3 py-3 max-w-[180px]">
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{tracker.network || '--'}</span>
                    </td>

                    {/* Added */}
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-400 tabular-nums">
                      {tracker.added || '--'}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-gray-400 text-sm">
                    No trackers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              Showing {sorted.length > 0 ? page * pageSize + 1 : 0}-{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
            </span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-xs font-medium">
              {page + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
