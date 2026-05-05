#!/usr/bin/env node
// Extract POIs that fail the rules-based culture resolution.
// Output: compact JSON for chunked LLM classification.
//
// Algorithm match (must mirror the final seed script):
//   1. Strip 4 meta-tags: Photography, Stories & Journals, Design, Follow your Heart
//   2. Map remaining tags via RULES; pick winner by frequency-in-row
//   3. If nothing left/maps → falls into LLM bucket

import fs from "fs";
import path from "path";

const SNAP_DIR = "/Users/samuraizan/zo-world/data/pois-snapshot";
const OUT_DIR = "/Users/samuraizan/conductor/workspaces/zo.xyz/marseille/data/pois";
fs.mkdirSync(OUT_DIR, { recursive: true });

const META_TAGS = new Set([
  "Photography", "Stories & Journals", "Design", "Follow your Heart",
]);

// Rules: Airtable tag (lowercased trimmed) → canonical culture key
const RULES = {
  // travel-adventure
  "travel & adventure": "travel-adventure", "adventure": "travel-adventure",
  "travel": "travel-adventure", "stroll": "travel-adventure",
  "sightseeing": "travel-adventure", "exploration": "travel-adventure",
  "treks": "travel-adventure",
  // food
  "food": "food", "drinks": "food",
  // music-entertainment
  "music & entertainment": "music-entertainment", "dance & music": "music-entertainment",
  "live music": "music-entertainment", "nightlife": "music-entertainment",
  "theater": "music-entertainment", "movie & theatre": "music-entertainment",
  // home-lifestyle (incl. amusement / kids)
  "home & lifestyle": "home-lifestyle", "shopping": "home-lifestyle",
  "fashion": "home-lifestyle", "kids place": "home-lifestyle",
  "kids park": "home-lifestyle", "amusement park": "home-lifestyle",
  "water park": "home-lifestyle",
  // law-order, literature
  "law & order": "law-order",
  "literature": "literature", "library": "literature", "exhibit": "literature",
  // spirituality (religion/devotion only — heritage handles history/museum)
  "spiritual": "spirituality", "church": "spirituality",
  "patriotism": "spirituality",
  // heritage (NEW canonical, 2026-05-04)
  "history": "heritage", "hist": "heritage",
  "museum": "heritage", "architecture": "heritage",
  "statues and monument": "heritage", "archaelogical": "heritage",
  "landmark": "heritage",
  // nature-wildlife
  "nature & wildlife": "nature-wildlife", "nature": "nature-wildlife",
  "scenic view": "nature-wildlife", "views": "nature-wildlife",
  "beach": "nature-wildlife", "park": "nature-wildlife",
  "garden": "nature-wildlife", "hikes": "nature-wildlife",
  "trails": "nature-wildlife", "ecological": "nature-wildlife",
  "zoo": "nature-wildlife", "picnic spot": "nature-wildlife",
  "aquarium": "nature-wildlife", "waterfall": "nature-wildlife",
  "lake": "nature-wildlife", "island": "nature-wildlife",
  "camping": "nature-wildlife", "boating": "nature-wildlife",
  "boatride": "nature-wildlife", "surfing": "nature-wildlife",
  // sports, health, sci-tech, games, business
  "sports": "sports", "stadium": "sports",
  "health & fitness": "health-fitness",
  "science & technology": "science-technology",
  "games": "games",
  "business": "business",
  "film making": "tv-cinema",
  // design (visual aesthetics — narrower now that heritage exists)
  "art": "design", "art & entertainment": "design", "exhibitions": "design",
  // catchall
  "cultural": "follow-your-heart", "local culture": "follow-your-heart",
};

function canon(tag) { return RULES[tag.toLowerCase().trim()] || null; }

function rulesResolve(rawTags) {
  const tags = rawTags.map(t => t.trim()).filter(t => !META_TAGS.has(t));
  if (!tags.length) return { culture: null, reason: "only-meta-or-empty" };
  const hits = new Map();
  for (const t of tags) {
    const c = canon(t);
    if (c) hits.set(c, (hits.get(c) || 0) + 1);
  }
  if (!hits.size) return { culture: null, reason: "no-canonical-match" };
  const sorted = [...hits.entries()].sort((a, b) => b[1] - a[1]);
  return { culture: sorted[0][0], reason: hits.size === 1 ? "single-rule" : "frequency-vote" };
}

const at = JSON.parse(fs.readFileSync(`${SNAP_DIR}/airtable.json`));

const resolved = [];
const fallback = [];
for (const r of at) {
  const tags = r.fields["Culture tags"] || [];
  const desc = r.fields["Description of Quest (140 characters)"] || "";
  const name = r.fields["Name your Quest"] || "";
  const dest = r.fields["Destination Name"] || "";
  const country = r.fields["Country Name"] || "";
  const res = rulesResolve(tags);
  if (res.culture) {
    resolved.push({ id: r.id, culture: res.culture, reason: res.reason });
  } else {
    fallback.push({
      id: r.id,
      name,
      description: desc,
      tags: tags.map(t => t.trim()),
      destination: dest,
      country,
      reason: res.reason,
    });
  }
}

fs.writeFileSync(`${OUT_DIR}/rules-resolved.json`, JSON.stringify(resolved, null, 2));
fs.writeFileSync(`${OUT_DIR}/llm-fallback.json`, JSON.stringify(fallback, null, 2));

// Distribution after rules pass
const dist = new Map();
for (const r of resolved) dist.set(r.culture, (dist.get(r.culture) || 0) + 1);

console.log(`=== Rules pass ===`);
console.log(`  resolved:    ${resolved.length} (${(resolved.length / at.length * 100).toFixed(1)}%)`);
console.log(`  fallback:    ${fallback.length} (${(fallback.length / at.length * 100).toFixed(1)}%)`);
console.log(`\n=== Resolved distribution ===`);
[...dist.entries()].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${n.toString().padStart(5)}  ${c}`));

console.log(`\n=== Fallback breakdown ===`);
const fbReason = new Map();
let withDesc = 0;
for (const f of fallback) {
  fbReason.set(f.reason, (fbReason.get(f.reason) || 0) + 1);
  if (f.description) withDesc++;
}
[...fbReason.entries()].forEach(([r, n]) => console.log(`  ${n.toString().padStart(4)}  ${r}`));
console.log(`  with description: ${withDesc} (LLM-classifiable)`);
console.log(`  no description:   ${fallback.length - withDesc} (auto → follow-your-heart)`);
console.log(`\nWrote: ${OUT_DIR}/rules-resolved.json + llm-fallback.json`);
