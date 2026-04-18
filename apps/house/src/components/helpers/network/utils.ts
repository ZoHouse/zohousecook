export function fixAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url
    .replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz")
    .replace("nsfp.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}
