import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Live feed of upcoming Zo events from Luma. The API key is bound to a
 * single Luma calendar (currently cal-ZVonmjVxLk7F2oM), so this route just
 * forwards the next N upcoming entries with a small in-memory cache to
 * avoid hammering Luma on every page hit.
 */

const LUMA_BASE = "https://public-api.lu.ma/public/v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — events change rarely
const PAGE_LIMIT = 8;

type LumaGeoAddress = {
  city?: string | null;
  region?: string | null;
  full_address?: string | null;
};

type LumaEvent = {
  api_id?: string;
  url?: string;
  name: string;
  cover_url?: string | null;
  start_at: string;
  end_at?: string | null;
  geo_address_json?: LumaGeoAddress | null;
};

type LumaEntry = { event: LumaEvent };

type LumaListResponse = {
  entries?: LumaEntry[];
  has_more?: boolean;
  next_cursor?: string | null;
};

export type ZoEventDTO = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  cover_url: string | null;
  url: string | null;
  location: string | null;
  house: "BLRxZo" | "WTFxZo" | null;
};

let cache: { fetchedAt: number; data: ZoEventDTO[] } | null = null;

function inferHouse(addr: LumaGeoAddress | null | undefined): ZoEventDTO["house"] {
  if (!addr) return null;
  const blob = `${addr.city ?? ""} ${addr.full_address ?? ""}`.toLowerCase();
  if (blob.includes("whitefield")) return "WTFxZo";
  if (blob.includes("koramangala") || blob.includes("bengaluru") || blob.includes("bangalore")) {
    return "BLRxZo";
  }
  return null;
}

function shorten(addr: LumaGeoAddress | null | undefined): string | null {
  if (!addr) return null;
  if (addr.city) return addr.city;
  if (addr.full_address) return addr.full_address.split(",")[0] ?? null;
  return null;
}

function normalize(entries: LumaEntry[]): ZoEventDTO[] {
  return entries
    .map((e) => e.event)
    .filter((ev): ev is LumaEvent => Boolean(ev && ev.start_at && ev.name))
    .map((ev) => ({
      id:        ev.api_id ?? ev.url ?? ev.name,
      title:     ev.name,
      start_at:  ev.start_at,
      end_at:    ev.end_at ?? null,
      cover_url: ev.cover_url ?? null,
      url:       ev.url ? (ev.url.startsWith("http") ? ev.url : `https://lu.ma/${ev.url}`) : null,
      location:  shorten(ev.geo_address_json),
      house:     inferHouse(ev.geo_address_json),
    }));
}

async function fetchUpcoming(apiKey: string): Promise<ZoEventDTO[]> {
  const after = new Date().toISOString();
  const url = `${LUMA_BASE}/calendar/list-events?after=${encodeURIComponent(after)}&pagination_limit=${PAGE_LIMIT}`;

  const res = await fetch(url, {
    headers: { "x-luma-api-key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    throw new Error(`luma list-events ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as LumaListResponse;
  return normalize(data.entries ?? []);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "luma not configured", events: [] });
  }

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({ events: cache.data, cached: true });
  }

  try {
    const events = await fetchUpcoming(apiKey);
    cache = { fetchedAt: now, data: events };
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({ events, cached: false });
  } catch (err) {
    console.error("[earn] /api/events failed:", err);
    if (cache) {
      // Serve stale on Luma outage rather than blank UI.
      return res.status(200).json({ events: cache.data, cached: true, stale: true });
    }
    return res.status(200).json({ events: [], error: (err as Error).message });
  }
}
