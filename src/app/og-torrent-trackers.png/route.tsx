import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f1117 0%, #1a1b2e 50%, #252640 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: '36px' }}>⚡</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#e5e7eb' }}>
            HackAnons <span style={{ color: '#818cf8' }}>Tools</span>
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}
        >
          Torrent Tracker List{' '}
          <span style={{ color: '#818cf8' }}>2026</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            color: '#9ca3af',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.5,
            marginBottom: '40px',
          }}
        >
          Daily updated list of 100+ working public BitTorrent trackers. One-click copy-paste.
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '48px' }}>
          {[
            { value: '100+', label: 'TRACKERS' },
            { value: '6h', label: 'UPDATES' },
            { value: '99%', label: 'UPTIME' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#818cf8' }}>{stat.value}</span>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
