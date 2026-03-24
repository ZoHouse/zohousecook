import { useQueryApi } from "@zo/auth";

interface NftToken {
  token_ref_id: string;
  collection?: string;
  contract_address?: string;
  metadata?: {
    name?: string;
    image_url?: string;
    animation_url?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}

interface WalletEntry {
  wallet_address: string;
  tokens: NftToken[];
}

export interface FlattenedNft {
  token_ref_id: string;
  wallet_address: string;
  name: string;
  image_url?: string;
  collection?: string;
}

function extractArray(data: unknown): WalletEntry[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results;
    if (obj.data) return extractArray(obj.data);
  }
  return [];
}

export function useFounderNfts(walletAddress?: string) {
  const { data, isLoading } = useQueryApi(
    "WEBTHREE_FOUNDER_NFTS",
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as any,
    "",
    ""
  );

  const walletEntries = extractArray(data);

  // Filter to user's wallet if provided, otherwise show all
  const entries = walletAddress
    ? walletEntries.filter(
        (entry) =>
          entry.wallet_address?.toLowerCase() === walletAddress.toLowerCase()
      )
    : walletEntries;

  const nfts: FlattenedNft[] = entries.flatMap((entry) =>
    (entry.tokens || []).map((token) => ({
      token_ref_id: token.token_ref_id,
      wallet_address: entry.wallet_address,
      name: token.metadata?.name || `#${token.token_ref_id}`,
      image_url: token.metadata?.image_url || token.metadata?.animation_url,
      collection: token.collection,
    }))
  );

  return { nfts, allEntries: walletEntries, isLoading };
}
