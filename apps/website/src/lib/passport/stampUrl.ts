import stampCdnMap from "../../data/stamp-cdn-map.json";

const STAMP_BASE = "https://cdn.zostel.com/destination";

const DESTINATION_ALIASES: Record<string, string> = {
  bengaluru: "Bangalore",
  "new-delhi": "Delhi",
  "old-manali": "Manali",
};

type StampCdnEntry = { layer: "city" | "trip" | "experience"; url: string };
const STAMP_CDN_MAP = stampCdnMap as Record<string, StampCdnEntry>;

function titleCase(part: string): string {
  if (!part) return part;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export function destinationSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolve a destination/trip/experience name to its stamp image URL.
 *
 * Lookup order:
 *   1. Slugify + apply DESTINATION_ALIASES → canonical slug
 *   2. New Zo CDN (cdn.zo.xyz) via the slug → URL map built by
 *      scripts/stamps/upload-stamps-to-cdn.py — covers all 197 master
 *      stamps (87 cities, 71 trips, 39 experiences).
 *   3. Fallback: old Zostel CDN colored SVG. Useful for any destination
 *      we haven't generated/uploaded a new stamp for yet.
 */
export function stampUrlFor(name: string): string | null {
  const rawSlug = destinationSlug(name);
  if (!rawSlug) return null;
  const canonical = DESTINATION_ALIASES[rawSlug];
  const displayName = canonical ?? name;
  const slug = destinationSlug(displayName);
  if (!slug) return null;

  const hit = STAMP_CDN_MAP[slug] || STAMP_CDN_MAP[rawSlug];
  if (hit) return hit.url;

  const fileName = slug.split("-").map(titleCase).join("-");
  return `${STAMP_BASE}/${slug}/stamp/colored/${fileName}.svg`;
}
