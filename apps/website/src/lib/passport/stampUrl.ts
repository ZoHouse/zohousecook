const STAMP_BASE = "https://cdn.zostel.com/destination";

const DESTINATION_ALIASES: Record<string, string> = {
  bengaluru: "Bangalore",
  "new-delhi": "Delhi",
  "old-manali": "Manali",
};

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

export function stampUrlFor(name: string): string | null {
  const rawSlug = destinationSlug(name);
  if (!rawSlug) return null;
  const canonical = DESTINATION_ALIASES[rawSlug];
  const displayName = canonical ?? name;
  const slug = destinationSlug(displayName);
  if (!slug) return null;
  const fileName = slug.split("-").map(titleCase).join("-");
  return `${STAMP_BASE}/${slug}/stamp/colored/${fileName}.svg`;
}
