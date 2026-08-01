import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { PROJECT_ID, PROJECT_URL } from '../../services/project';

// UA sniffing catches the honest bots, the other two checks catch headless
// browsers pretending to be a regular Chrome.
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitoring|scrape|archiver|semrush|ahrefs|dataprovider|curl|wget|python-requests|okhttp|axios|node-fetch|go-http-client/i;

const isBot = () =>
  navigator.webdriver === true ||
  !navigator.languages?.length ||
  BOT_UA.test(navigator.userAgent);

const ENGAGEMENT_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
] as const;
const ENGAGEMENT_TIMEOUT = 5000;

/**
 * Loads the tracker only once we see a sign of a real visitor: any interaction,
 * or a few seconds spent on a visible tab. Prerendered pages, background tabs
 * and drive-by scrapers never get that far, which keeps them out of our quota.
 */
const useIsVisitorEngaged = () => {
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    if (isBot()) {
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      controller.abort();
      clearTimeout(timer);
    };

    const onEngaged = () => {
      stop();
      setEngaged(true);
    };

    const armTimer = () => {
      if (document.visibilityState === 'visible' && timer === undefined) {
        timer = setTimeout(onEngaged, ENGAGEMENT_TIMEOUT);
      }
    };

    ENGAGEMENT_EVENTS.forEach((event) =>
      window.addEventListener(event, onEngaged, { passive: true, signal }),
    );
    document.addEventListener('visibilitychange', armTimer, { signal });
    armTimer();

    return stop;
  }, []);

  return engaged;
};

export const Umami = () => {
  const isOpenClimbing = PROJECT_ID === 'openclimbing';
  const websiteId = isOpenClimbing
    ? process.env.NEXT_PUBLIC_UMAMI_ID_OPENCLIMBING
    : process.env.NEXT_PUBLIC_UMAMI_ID_OSMAPP;

  const engaged = useIsVisitorEngaged();

  if (!websiteId || process.env.NODE_ENV !== 'production' || !engaged) {
    return null;
  }

  // keeps preview deploys and forks out of the stats
  const host = PROJECT_URL.replace(/^https?:\/\//, '');

  return (
    <Script
      defer
      src="https://cloud.umami.is/script.js"
      data-website-id={websiteId}
      data-domains={`${host},www.${host}`}
      data-exclude-hash="true" // map view lives in the hash – every pan would be a pageview
      data-exclude-search="true" // so would every keystroke in the search box
      data-do-not-track="true"
    />
  );
};
