'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

// Load AdSense script once globally
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

// Individual ad unit component
interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdUnit({ slot, format = 'auto', responsive = true, className = '', style }: AdUnitProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adRef = useRef<HTMLDivElement>(null);
  const [adPushed, setAdPushed] = useState(false);

  useEffect(() => {
    if (!clientId || adPushed) return;

    // Wait until the container has a non-zero width before pushing the ad
    // This prevents the "No slot size for availableWidth=0" error
    const container = adRef.current;
    if (!container) return;

    const tryPushAd = () => {
      if (container.offsetWidth > 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setAdPushed(true);
        } catch {
          // AdSense not loaded yet
        }
        return true;
      }
      return false;
    };

    // Try immediately
    if (tryPushAd()) return;

    // If container isn't visible yet, observe for visibility
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Small delay to ensure layout is complete
          requestAnimationFrame(() => {
            tryPushAd();
          });
          observer.disconnect();
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [clientId, adPushed]);

  if (!clientId) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-400 ${className}`} style={style}>
        Ad Space
      </div>
    );
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
