import type { NextApiRequest, NextApiResponse } from "next";

// Returns the events that visitors see on luma.com/blrxzo. Luma's public
// `calendar/get-items` endpoint already includes both the calendar's own
// events AND featured events from other calendars (1Claw build days, partner
// sprints, etc), which the authenticated list-events endpoint does not. We
// fetch period=future + period=past, merge by event api_id, and cache briefly.

type LumaApiEvent = {
  api_id: string;
  name: string;
  start_at: string;
  end_at?: string | null;
  url?: string | null;
  cover_url?: string | null;
};

type LumaItemsResponse = {
  entries?: { event: LumaApiEvent }[];
};

export type CalendarEvent = {
  id: string;
  name: string;
  start_at: string;
  end_at: string | null;
  url: string;
  cover_url: string | null;
};

const CALENDAR_API_ID = "cal-ZVonmjVxLk7F2oM"; // BLRxZo

function eventUrl(
  slugOrUrl: string | null | undefined,
  fallbackId: string
): string {
  if (!slugOrUrl) return `https://luma.com/${fallbackId}`;
  if (slugOrUrl.startsWith("http")) return slugOrUrl;
  return `https://luma.com/${slugOrUrl}`;
}

async function fetchItems(
  period: "future" | "past",
  limit: number
): Promise<CalendarEvent[]> {
  try {
    const r = await fetch(
      `https://api.lu.ma/calendar/get-items?calendar_api_id=${CALENDAR_API_ID}&period=${period}&pagination_limit=${limit}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ZoHouseSite/1.0)",
        },
      }
    );
    if (!r.ok) return [];
    const data = (await r.json()) as LumaItemsResponse;
    return (data.entries ?? [])
      .map(({ event: e }): CalendarEvent | null => {
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
  try {
    const [future, past] = await Promise.all([
      fetchItems("future", 100),
      fetchItems("past", 100),
    ]);

    // Dedupe by event id (an event can appear in both lists transiently).
    const map = new Map<string, CalendarEvent>();
    for (const e of past) map.set(e.id, e);
    for (const e of future) map.set(e.id, e);
    const events = Array.from(map.values()).sort(
      (a, b) => +new Date(a.start_at) - +new Date(b.start_at)
    );

    // Edge cache: fresh for 5 min, then serve stale while revalidating for up
    // to an hour. The browser also caches in sessionStorage on the client side.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
    res.status(200).json({ events });
  } catch {
    res.status(500).json({ error: "Failed to load events" });
  }
}
