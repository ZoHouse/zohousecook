import { useEffect, useState } from "react";

const API_BASE = process.env.API_BASE_URL || "https://api.io.zo.xyz";
const CLIENT_KEY =
  process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB ||
  process.env.APP_ID ||
  "1482d843137574f36f74";

export interface FounderNft {
  token_ref_id: string;
  nickname: string;
  pfp_image: string;
  tags: string[];
}

export interface FounderStats {
  total_supply?: number;
}

async function zoGet<T>(path: string): Promise<T | undefined> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "client-key": CLIENT_KEY },
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.data as T;
  } catch {
    return undefined;
  }
}

export function useFounderNfts(): FounderNft[] | undefined {
  const [data, setData] = useState<FounderNft[] | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    zoGet<FounderNft[]>("/api/v1/webthree/founder/nfts/?limit=500").then(
      (d) => {
        if (!cancelled) setData(d);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

export function useFounderStats(): FounderStats | undefined {
  const [data, setData] = useState<FounderStats | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    zoGet<FounderStats>("/api/v1/cas/founder-tokens/stats/").then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
