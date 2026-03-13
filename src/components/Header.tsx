'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-[#0f1117]/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-6">
        <Link href="https://tools.hackanons.com" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-gray-100 no-underline">
          <span className="text-xl">&#9889;</span>
          <span>HackAnons <span className="text-indigo-600 dark:text-indigo-400">Tools</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link href="https://tools.hackanons.com" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors no-underline">
            All Tools
          </Link>
          <Link href="/torrent-trackers-list#tracker-lists" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors no-underline">
            Trackers
          </Link>
          <Link href="/torrent-trackers-list#tracker-database" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors no-underline">
            Database
          </Link>
          <Link href="/torrent-trackers-list#how-to-use" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors no-underline">
            How To Use
          </Link>
          <Link href="/torrent-trackers-list#faq" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors no-underline">
            FAQ
          </Link>
        </nav>

        <button
          onClick={toggle}
          className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
