#!/usr/bin/env node
// One-shot: extract FSQ POIs from /Users/samuraizan/zo-world/poi_cache.json
// into the snapshot folder. No network calls — pure local copy.

import fs from "fs";
import path from "path";

const SRC = "/Users/samuraizan/zo-world/poi_cache.json";
const OUT_DIR = "/Users/samuraizan/zo-world/data/pois-snapshot";
const OUT = path.join(OUT_DIR, "fsq.json");

const cache = JSON.parse(fs.readFileSync(SRC, "utf8"));

const flat = [];
const categories = new Map();
let destWithFsq = 0, destEmpty = 0;

for (const [destName, dest] of Object.entries(cache)) {
  const fsq = dest.pois_fsq || [];
  if (fsq.length) destWithFsq++; else { destEmpty++; continue; }
  for (const p of fsq) {
    if (!p.fsq_place_id) continue;
    flat.push({
      fsq_place_id: p.fsq_place_id,
      name: p.name,
      category: p.category || null,
      category_id: p.category_id || null,
      lat: p.lat,
      lon: p.lon,
      distance_m_from_destination: p.distance_m ?? null,
      destination: destName,
      destination_lat: dest.lat,
      destination_lon: dest.lon,
      country: dest.country || null,
    });
    const c = p.category || "(none)";
    categories.set(c, (categories.get(c) || 0) + 1);
  }
}

// Dedup by fsq_place_id (same place may sit near multiple destinations)
const byId = new Map();
for (const r of flat) {
  if (!byId.has(r.fsq_place_id)) byId.set(r.fsq_place_id, r);
}
const deduped = [...byId.values()];

fs.writeFileSync(OUT, JSON.stringify(deduped, null, 2));

const sortedCats = [...categories.entries()].sort((a, b) => b[1] - a[1]);
fs.writeFileSync(
  path.join(OUT_DIR, "fsq-categories.json"),
  JSON.stringify(Object.fromEntries(sortedCats), null, 2)
);

console.log(`Source destinations: ${Object.keys(cache).length}`);
console.log(`  with FSQ data:     ${destWithFsq}`);
console.log(`  with no FSQ data:  ${destEmpty}`);
console.log(`Raw FSQ POIs:        ${flat.length}`);
console.log(`After dedup:         ${deduped.length} → ${OUT}`);
console.log(`Distinct categories: ${categories.size} → fsq-categories.json`);
console.log(`\nTop 10 categories:`);
sortedCats.slice(0, 10).forEach(([c, n]) => console.log(`  ${n.toString().padStart(4)}  ${c}`));
