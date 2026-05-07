import { useEffect, useRef, useState } from "react";

const PASSPORT_ENDPOINT = `${
  process.env.API_BASE_URL || "https://api.io.zo.xyz"
}/api/v1/passport`;

export type PassportLockState = "" | "locked" | "unlocked_free" | "unlocked_pro";

export interface PublicPassport {
  handle: string;
  custom_nickname: string;
  full_name: string | null;
  avatar_image: string | null;
  pfp_image: string | null;
  place_name: string | null;
  country: string | null;
  state: PassportLockState;
  xp_total: number;
  rank_title: string | null;
  roles: Array<{ key: string; label: string }>;
  stats: {
    destinations: number;
    stays: number;
    tribe: number;
    reels: number;
  };
  stamps: Array<unknown>;
  badges: Array<unknown>;
  trophies: Array<unknown>;
  reels: Array<unknown>;
  tribe_sample: Array<unknown>;
}

function emptyToNull(s: unknown): string | null {
  if (s === null || s === undefined) return null;
  const trimmed = String(s).trim();
  return trimmed === "" ? null : trimmed;
}

// Mirror of fixAvatarUrl in PassportIdentityCard.tsx so public and private
// views resolve the same IPFS / CDN quirks. Keep these in sync.
// nsfp.cdn.zo.xyz returns 403 on direct public image access; proxy.cdn.zo.xyz
// serves the same asset with 200. The passport public endpoint currently
// returns pfp_image URLs under nsfp.cdn.zo.xyz, so this rewrite is
// load-bearing for NFT avatars to render at all.
export function fixAvatarUrl(url?: string | null): string | null {
  if (!url || url.length === 0) return null;
  if (url.startsWith("ipfs://"))
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  return url
    .replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz")
    .replace("nsfp.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function normaliseRoles(raw: unknown): PublicPassport["roles"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: unknown) => {
      if (typeof r === "string") return { key: r.toLowerCase(), label: r };
      if (r && typeof r === "object") {
        const obj = r as Record<string, unknown>;
        const key = obj.key || obj.name || obj.label;
        const label = obj.label || obj.name || obj.key;
        if (!key || !label) return null;
        return { key: String(key).toLowerCase(), label: String(label) };
      }
      return null;
    })
    .filter((r): r is { key: string; label: string } => r !== null);
}

// Pure — takes the raw /api/v1/passport/{handle}/ body and produces the shape
// consumers use. Exported so getServerSideProps can build the same object
// once server-side and pass it as initialData, killing the duplicate client
// fetch on refresh.
export function normalisePublicPassport(
  raw: Record<string, unknown>,
  handle: string,
): PublicPassport {
  const nickname = handle.endsWith(".zo") ? handle : `${handle}.zo`;
  const stats = (raw.stats as Record<string, unknown>) || {};
  return {
    handle,
    custom_nickname: String(raw.custom_nickname ?? nickname),
    full_name: emptyToNull(raw.full_name),
    // Zo Zobu composite — matches profile.avatar.image on the private side.
    // Field name candidates seen in the API: avatar_image, avatar_url,
    // avatar.image nested. Accept any; backend is still finalising.
    avatar_image: fixAvatarUrl(
      emptyToNull(
        raw.avatar_image ||
          raw.avatar_url ||
          (raw.avatar && typeof raw.avatar === "object"
            ? (raw.avatar as Record<string, unknown>).image
            : null),
      ),
    ),
    pfp_image: fixAvatarUrl(emptyToNull(raw.pfp_image)),
    place_name: emptyToNull(raw.place_name),
    country: emptyToNull(raw.country),
    state: (raw.state as PassportLockState) || "",
    xp_total: Number(raw.xp_total) || 0,
    rank_title: emptyToNull(raw.rank_title),
    roles: normaliseRoles(raw.roles),
    stats: {
      destinations: Number(stats.destinations) || 0,
      stays: Number(stats.stays) || 0,
      tribe: Number(stats.tribe) || 0,
      reels: Number(stats.reels) || 0,
    },
    stamps: Array.isArray(raw.stamps) ? raw.stamps : [],
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    trophies: Array.isArray(raw.trophies) ? raw.trophies : [],
    reels: Array.isArray(raw.reels) ? raw.reels : [],
    tribe_sample: Array.isArray(raw.tribe_sample) ? raw.tribe_sample : [],
  };
}

async function fetchPublicPassport(
  handle: string,
): Promise<PublicPassport | null> {
  const nickname = handle.endsWith(".zo") ? handle : `${handle}.zo`;
  const res = await fetch(
    `${PASSPORT_ENDPOINT}/${encodeURIComponent(nickname)}/`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`passport fetch failed: ${res.status}`);
  const raw = (await res.json()) as Record<string, unknown>;
  return normalisePublicPassport(raw, handle);
}

/**
 * Fetches public passport data for a handle. Accepts optional `initialData`
 * seeded from SSR — when the seed's handle matches, the hook skips the client
 * fetch entirely, eliminating the duplicate round-trip on refresh of /@handle.
 */
export function usePublicPassport(
  handle: string | null,
  initialData?: PublicPassport | null,
) {
  const seed =
    initialData && handle && initialData.handle === handle ? initialData : null;
  const [data, setData] = useState<PublicPassport | null>(seed);
  const [isLoading, setIsLoading] = useState(!!handle && !seed);
  const [isError, setIsError] = useState(false);
  // Tracks the handle we last have good data for so a handle change forces a
  // refetch but a same-handle remount doesn't.
  const fetchedHandleRef = useRef<string | null>(seed?.handle ?? null);

  useEffect(() => {
    if (!handle) {
      setData(null);
      setIsLoading(false);
      return;
    }
    if (fetchedHandleRef.current === handle) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    fetchPublicPassport(handle)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        fetchedHandleRef.current = handle;
      })
      .catch(() => {
        if (cancelled) return;
        setIsError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return { data, isLoading, isError };
}
