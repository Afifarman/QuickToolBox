'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'qtb_ads_consent_v1';
const ADS_CLIENT = 'ca-pub-4690893675414003';

/**
 * Google AdSense is only loaded after the visitor accepts. Until then the site
 * is fully usable and no advertising cookies are set.
 */
export default function ConsentAndAds() {
  const [consent, setConsent] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    setConsent(stored === 'granted' || stored === 'denied' ? stored : null);
    setReady(true);
  }, []);

  function choose(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Storage can be blocked; the choice still applies for this page view. */
    }
    setConsent(value);
  }

  return (
    <>
      {consent === 'granted' && (
        <Script
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`}
          crossOrigin="anonymous"
        />
      )}

      {ready && consent === null && (
        <div className="qt-consent" role="region" aria-label="Advertising and cookie choice">
          <p>
            <strong>Ads keep these tools free.</strong> We use Google AdSense, which sets advertising
            cookies. You can decline and keep using every tool without ads.
          </p>
          <div className="qt-consent-actions">
            <button type="button" className="qt-consent-decline" onClick={() => choose('denied')}>
              Decline ads
            </button>
            <button type="button" className="qt-consent-accept" onClick={() => choose('granted')}>
              Accept ads
            </button>
          </div>
        </div>
      )}
    </>
  );
}
