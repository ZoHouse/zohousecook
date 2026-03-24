import { useQueryApi } from "@zo/auth";

export interface FounderMemberSummary {
  wallets_count: number;
  users_count: number;
}

export interface FounderMemberEntry {
  wallet_address: string;
  nickname?: string;
  pfp_image?: string;
  token_count: number;
}

function extractEntries(data: unknown): { summary: FounderMemberSummary | null; members: FounderMemberEntry[] } {
  if (!data) return { summary: null, members: [] };

  // Navigate through axios wrapper
  const inner = typeof data === "object" && data !== null && "data" in data
    ? (data as Record<string, unknown>).data
    : data;

  // The /founder/members/ endpoint returns summary: { wallets_count, users_count }
  if (typeof inner === "object" && inner !== null && "wallets_count" in (inner as Record<string, unknown>)) {
    return {
      summary: inner as FounderMemberSummary,
      members: [],
    };
  }

  return { summary: null, members: [] };
}

export function useFounderMembers() {
  const { data, isLoading } = useQueryApi(
    "WEBTHREE_FOUNDER_MEMBERS",
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as any,
    "",
    ""
  );

  const { summary } = extractEntries(data);

  return {
    summary,
    isLoading,
  };
}
