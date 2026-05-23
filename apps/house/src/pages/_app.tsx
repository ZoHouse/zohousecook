import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ZoAuthProvider } from "../hooks/useZoAuth";
import { CalendarWidget } from "../components/CalendarWidget";
import { initDestinations } from "../lib/analytics/destinations";
import { initConsent } from "../lib/analytics/consent";
import { captureFirstTouch, getFirstTouch } from "../lib/analytics/utm";
import { getOrCreateAnonymousId } from "../lib/analytics/identity";
import { track } from "../lib/analytics/track";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // One-time init.
  useEffect(() => {
    initConsent();

    // initDestinations always runs. each adapter checks its own globals at
    // call time so a missing env var for one tool never disables the others
    // (per spec §13.3 failure isolation).
    initDestinations({
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });

    // Anonymous ID generated lazily on first event.
    getOrCreateAnonymousId();

    captureFirstTouch(window.location.href);
  }, []);

  // Fire page_view on every route change AND on first paint.
  useEffect(() => {
    const fire = (url: string) => {
      const ft = getFirstTouch();
      track("page_view", {
        url,
        referrer: document.referrer || null,
        utm_source: ft?.utm_source,
        utm_medium: ft?.utm_medium,
        utm_campaign: ft?.utm_campaign,
        utm_content: ft?.utm_content,
        utm_term: ft?.utm_term,
      });
    };
    fire(window.location.href);
    router.events.on("routeChangeComplete", fire);
    return () => router.events.off("routeChangeComplete", fire);
  }, [router.events]);

  return (
    <ZoAuthProvider>
      <Head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
      <CalendarWidget />
      <VercelAnalytics />
      <SpeedInsights />
    </ZoAuthProvider>
  );
}
