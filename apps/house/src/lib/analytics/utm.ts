const STORAGE_KEY = "zo_house_first_touch";

export interface FirstTouch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbc?: string;
  captured_at: string;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function captureFirstTouch(href: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  const url = new URL(href);
  const params = url.searchParams;
  const captured: FirstTouch = { captured_at: new Date().toISOString() };

  let hasAny = false;
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) {
      captured[k] = v;
      hasAny = true;
    }
  }

  const fbclid = params.get("fbclid");
  if (fbclid) {
    // Meta's documented format is fb.<subdomain_index>.<creation_time_ms>.<fbclid>.
    // subdomain_index = 1 for root domain (zo.house). Use 2 for one-level subdomain
    // if we ever serve the funnel from a subdomain. Currently always root.
    captured.fbc = `fb.1.${Date.now()}.${fbclid}`;
    hasAny = true;
  }

  if (hasAny) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  }
}

export function getFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FirstTouch;
  } catch {
    return null;
  }
}

// Note: captureFirstTouch is a no-op once first-touch is set. SPA route changes
// after the first hard nav will not overwrite first-touch attribution. This is
// by design — the user's TRUE first touch is the marketing entry point.
// Cluster pages are intended to be entered directly from search/ads, so each
// hard-nav landing captures its own first-touch.
