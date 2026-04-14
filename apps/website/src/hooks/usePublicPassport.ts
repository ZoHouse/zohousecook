import { useEffect, useState } from "react";

export type PassportState = "locked" | "unlocked_free" | "unlocked_pro";

export interface PublicPassport {
  handle: string;
  custom_nickname: string;
  display_name: string;
  avatar_url: string | null;
  hometown: string | null;
  nationality: string | null;
  state: PassportState;
  xp: { total: number; rank_title: string };
  roles: Array<{ key: string; label: string }>;
  badges: Array<{ key: string; label: string; tier: "rolling" | "all_time" }>;
  stamps: Array<{ key: string; label: string; art_url: string | null }>;
  trophies: Array<{ season: string; rank: number; medal: "gold" | "silver" | "bronze" }>;
  stats: {
    destinations: number;
    stays: number;
    properties: number;
    tribe: number;
    reels_submitted: number;
    reels_qualified: number;
  };
  reels: Array<{
    id: string;
    prompt: string;
    ig_post_url: string;
    thumbnail_url: string;
    status: string;
    views: number;
  }>;
  tribe_sample: Array<{ handle: string; avatar_url: string | null }>;
  tribe_total: number;
}

// TODO(L3): swap to real fetch once zo-backend PR #3414 lands the
// passport/ app and the /passport/api/v1/public/<handle>/ endpoint.
// See docs/superpowers/specs/2026-04-14-passport-public-endpoint-design.md
async function fetchPublicPassportStub(handle: string): Promise<PublicPassport> {
  return {
    handle,
    custom_nickname: `${handle}.zo`,
    display_name: handle.charAt(0).toUpperCase() + handle.slice(1),
    avatar_url: null,
    hometown: null,
    nationality: null,
    state: "unlocked_pro",
    xp: { total: 12450, rank_title: "Explorer" },
    roles: [{ key: "citizen", label: "Citizen of Zo World" }],
    badges: [],
    stamps: [],
    trophies: [],
    stats: {
      destinations: 0,
      stays: 0,
      properties: 0,
      tribe: 0,
      reels_submitted: 0,
      reels_qualified: 0,
    },
    reels: [],
    tribe_sample: [],
    tribe_total: 0,
  };
}

export function usePublicPassport(handle: string | null) {
  const [data, setData] = useState<PublicPassport | null>(null);
  const [isLoading, setIsLoading] = useState(!!handle);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!handle) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    fetchPublicPassportStub(handle)
      .then((res) => {
        if (cancelled) return;
        setData(res);
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
