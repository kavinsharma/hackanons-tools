import { Metadata } from 'next';
import { getTrackerData, TrackerData } from '@/lib/fetcher';
import TrackerPage from '@/components/TrackerPage';

export const metadata: Metadata = {
  title: 'Updated Torrent Tracker List 2026 - Daily Updated Best Trackers',
  description:
    'Get the latest updated torrent tracker list for 2026. Daily updated list of 100+ working public BitTorrent trackers. One-click copy for uTorrent, qBittorrent, Transmission & more.',
  keywords: [
    'torrent tracker list',
    'torrent tracker list 2026',
    'bittorrent trackers',
    'udp trackers',
    'best torrent trackers 2026',
    'working trackers',
    'torrent tracker list updated',
    'public trackers',
    'qbittorrent trackers',
    'utorrent trackers',
    'transmission trackers',
    'torrent speed increase',
    'add trackers to torrent',
    'tracker list copy paste',
  ],
  alternates: {
    canonical: 'https://tools.hackanons.com/torrent-trackers-list',
  },
  openGraph: {
    title: 'Updated Torrent Tracker List 2026 - Daily Updated Best Trackers',
    description:
      'Daily updated list of 100+ working public BitTorrent trackers. One-click copy-paste for all torrent clients.',
    url: 'https://tools.hackanons.com/torrent-trackers-list',
    type: 'website',
    siteName: 'HackAnons Tools',
    images: [
      {
        url: '/og-torrent-trackers.png',
        width: 1200,
        height: 630,
        alt: 'Torrent Tracker List 2026 - Daily Updated',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Updated Torrent Tracker List 2026 - Daily Updated',
    description:
      'Daily updated list of 100+ working public BitTorrent trackers. One-click copy-paste.',
    images: ['/og-torrent-trackers.png'],
  },
};

// Revalidate every 6 hours
export const revalidate = 21600;

function getStructuredData(data: TrackerData) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Updated Torrent Tracker List 2026',
      description:
        'Daily updated list of working public BitTorrent trackers with one-click copy functionality.',
      url: 'https://tools.hackanons.com/torrent-trackers-list',
      dateModified: data.lastUpdated,
      inLanguage: 'en-US',
      publisher: {
        '@type': 'Organization',
        name: 'HackAnons',
        url: 'https://tools.hackanons.com',
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'Torrent Tracker List Tool',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Tools',
          item: 'https://tools.hackanons.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Torrent Tracker List',
          item: 'https://tools.hackanons.com/torrent-trackers-list',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a torrent tracker?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A torrent tracker is a server that helps coordinate the transfer of files between peers using the BitTorrent protocol. It keeps track of which peers have which pieces of a file, connecting downloaders (leechers) with uploaders (seeders) to facilitate faster downloads.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I add trackers to my torrent client?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Copy the tracker list using the copy button, then in your torrent client (uTorrent, qBittorrent, etc.), right-click on a torrent, select Properties or Edit Trackers, and paste the tracker URLs.',
          },
        },
        {
          '@type': 'Question',
          name: 'How often is this tracker list updated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our tracker list is automatically updated every 6 hours. We source our data from newTrackon (live monitoring) and ngosang/trackerslist (community curated), ensuring the most current working trackers.',
          },
        },
        {
          '@type': 'Question',
          name: 'Will adding more trackers increase my download speed?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, adding more trackers can significantly increase download speeds by connecting you to more peers who have the file you want. More trackers mean more potential seeders, which directly translates to faster downloads.',
          },
        },
      ],
    },
  ];
}

export default async function Page() {
  const data = await getTrackerData();
  const structuredData = getStructuredData(data);

  return (
    <>
      {structuredData.map((sd, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }}
        />
      ))}
      <TrackerPage data={data} />
    </>
  );
}
