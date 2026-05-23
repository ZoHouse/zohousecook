import type { NextApiRequest, NextApiResponse } from "next";

// Returns the events that visitors see on luma.com/blrxzo. The Luma public
// API only returns events the calendar *owns*, but BLRxZo also features
// events from other calendars (1Claw Build Day, partner sprints, etc). To
// match the public page we merge two sources:
//   1. Luma API list-events  -> own events (recent + upcoming).
//   2. Public page __NEXT_DATA__ -> featured_items (own + external).
// Dedupe by event api_id, sort by start time. Cache the result briefly.

type LumaApiEvent = {
  api_id: string;
  name: string;
  start_at: string;
  end_at?: string | null;
  url?: string | null;
  cover_url?: string | null;
};

type LumaListResponse = {
  entries?: { event: LumaApiEvent }[];
};

type FeaturedItemEvent = {
  api_id?: string;
  name?: string;
  start_at?: string;
  end_at?: string | null;
  url?: string | null;
  cover_url?: string | null;
};

export type CalendarEvent = {
  id: string;
  name: string;
  start_at: string;
  end_at: string | null;
  url: string;
  cover_url: string | null;
};

const CALENDAR_SLUG = "blrxzo";

function eventUrl(
  slugOrUrl: string | null | undefined,
  fallbackId: string
): string {
  if (!slugOrUrl) return `https://luma.com/${fallbackId}`;
  if (slugOrUrl.startsWith("http")) return slugOrUrl;
  return `https://luma.com/${slugOrUrl}`;
}

async function fetchOwnEvents(apiKey: string): Promise<CalendarEvent[]> {
  const after = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
  try {
    const r = await fetch(
      `https://api.lu.ma/public/v1/calendar/list-events?pagination_limit=200&after=${encodeURIComponent(
        after
      )}`,
      { headers: { "x-luma-api-key": apiKey } }
    );
    if (!r.ok) return [];
    const data = (await r.json()) as LumaListResponse;
    return (data.entries ?? []).map(({ event }) => ({
      id: event.api_id,
      name: event.name,
      start_at: event.start_at,
      end_at: event.end_at ?? null,
      url: eventUrl(event.url, event.api_id),
      cover_url: event.cover_url ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchFeaturedEvents(): Promise<CalendarEvent[]> {
  try {
    const r = await fetch(`https://luma.com/${CALENDAR_SLUG}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZoHouseSite/1.0)",
      },
    });
    if (!r.ok) return [];
    const html = await r.text();
    const m = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (!m) return [];
    const data = JSON.parse(m[1]) as {
      props?: {
        pageProps?: {
          initialData?: {
            data?: { featured_items?: { event?: FeaturedItemEvent }[] };
          };
        };
      };
    };
    const items =
      data?.props?.pageProps?.initialData?.data?.featured_items ?? [];
    return items
      .map((it): CalendarEvent | null => {
        const e = it.event;
        if (!e || !e.api_id || !e.name || !e.start_at) return null;
        return {
          id: e.api_id,
          name: e.name,
          start_at: e.start_at,
          end_at: e.end_at ?? null,
          url: eventUrl(e.url, e.api_id),
          cover_url: e.cover_url ?? null,
        };
      })
      .filter((x): x is CalendarEvent => x !== null);
  } catch {
    return [];
  }
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ events: CalendarEvent[] } | { error: string }>
) {
  const apiKey = process.env.LUMA_API_KEY_BLR;
  if (!apiKey) {
    res.status(500).json({ error: "LUMA_API_KEY_BLR not configured" });
    return;
  }

  try {
    const [own, featured] = await Promise.all([
      fetchOwnEvents(apiKey),
      fetchFeaturedEvents(),
    ]);

    // Dedupe by event id. Featured wins on a tie so the public page is the
    // source of truth for what visitors see.
    const map = new Map<string, CalendarEvent>();
    for (const e of own) map.set(e.id, e);
    for (const e of featured) map.set(e.id, e);
    const events = Array.from(map.values()).sort(
      (a, b) => +new Date(a.start_at) - +new Date(b.start_at)
    );

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ events });
  } catch {
    res.status(500).json({ error: "Failed to load events" });
  }
}
