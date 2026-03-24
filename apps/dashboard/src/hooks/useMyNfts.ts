import { useProfile } from "@zo/auth";

export interface MyNft {
  token_ref_id: string;
  name: string;
  image_url: string;
}

/**
 * Returns the current user's founder NFTs based on profile.founder_tokens.
 * founder_tokens is an array of token ID strings like ['523', '204', '158', '151'].
 * NFT images follow the pattern: https://nft-cdn.zo.xyz/founders/{id}.gif
 */
export function useMyNfts() {
  const { profile, isLoading } = useProfile();

  // founder_tokens from profile is an array of token ID strings
  const founderTokenIds: string[] = Array.isArray(profile?.founder_tokens)
    ? profile.founder_tokens
    : [];

  const nfts: MyNft[] = founderTokenIds.map((id: string) => ({
    token_ref_id: id,
    name: `Founder #${id}`,
    image_url: `https://nft-cdn.zo.xyz/founders/${id}.gif`,
  }));

  return { nfts, isLoading };
}
