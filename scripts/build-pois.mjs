#!/usr/bin/env node
// Normalize the local poi_cache.json into a Mapbox-ready GeoJSON FeatureCollection
// for the @handle map overlay.
//
// Usage:
//   node scripts/build-pois.mjs                    # default input/output paths
//   node scripts/build-pois.mjs --input <path>     # override input
//   node scripts/build-pois.mjs --output <path>    # override output
//
// Defaults:
//   input  = ../../poi_cache.json (relative to this script — repo workspace root)
//   output = apps/website/public/pois.geojson
//
// The output is committed; CI does NOT run this. Re-run by hand whenever
// poi_cache.json gets refreshed.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// ---------- bucket logic (mirrors apps/website/src/components/passport-lobby/poi/clusters.ts)

/** @typedef {'food'|'nature'|'spiritual'|'heritage'|'shopping'|'vibe'|'place'} BucketId */

const AIRTABLE_TAG_PRIORITY = [
  // specific (always-win)
  { bucket: 'spiritual', tags: ['Spiritual', 'cultural'] },
  { bucket: 'food', tags: ['Food', 'Food ', 'Drinks'] },
  { bucket: 'nature', tags: [
      'Nature & Wildlife', 'Nature', 'Beach', 'Park', 'Garden',
      'Trails', 'Trails ', 'Hikes', 'Scenic View', 'Views',
    ] },
  { bucket: 'heritage', tags: [
      'History', 'Architecture', 'Museum', 'Art', 'Art & Entertainment',
      'Exhibitions',
    ] },
  { bucket: 'vibe', tags: [
      'Music & Entertainment', 'Dance & Music', 'Amusement Park',
      'Games', 'Games ',
    ] },
  { bucket: 'shopping', tags: [
      'Shopping', 'Shopping ', 'Market', 'Local Culture',
      'Home & Lifestyle',
    ] },
  // vibe fallbacks
  { bucket: 'nature', tags: ['Travel & Adventure', 'Adventure', 'Exploration', 'travel'] },
  { bucket: 'heritage', tags: ['Design'] },
  { bucket: 'vibe', tags: ['Film Making', 'Sports', 'Stadium'] },
];

const FSQ_CATEGORY_BUCKET = {
  // food
  'Indian Restaurant': 'food', 'North Indian Restaurant': 'food',
  'South Indian Restaurant': 'food', 'Restaurant': 'food', 'Café': 'food',
  'Coffee Shop': 'food', 'Bakery': 'food', 'Pizzeria': 'food', 'Bar': 'food',
  'Vegan and Vegetarian Restaurant': 'food', 'Fast Food Restaurant': 'food',
  'Sandwich Spot': 'food', 'Italian Restaurant': 'food',
  'Asian Restaurant': 'food', 'Chinese Restaurant': 'food',
  'Grocery Store': 'food', 'Snack Place': 'food', 'Hotel Bar': 'food',
  'Ice Cream Parlor': 'food', 'Tea Room': 'food', 'Juice Bar': 'food',
  'Diner': 'food', 'Breakfast Spot': 'food', 'Beach Bar': 'food',
  'French Restaurant': 'food', 'Fried Chicken Joint': 'food',
  'Dessert Shop': 'food',
  // nature
  'Mountain': 'nature', 'Beach': 'nature', 'Lake': 'nature', 'River': 'nature',
  'Park': 'nature', 'Garden': 'nature', 'Scenic Lookout': 'nature',
  'Hiking Trail': 'nature', 'Other Great Outdoors': 'nature',
  'Forest': 'nature', 'Waterfall': 'nature', 'Farm': 'nature',
  'Campground': 'nature', 'Zoo': 'nature', 'Bridge': 'nature',
  'Golf Course': 'nature', 'Village': 'nature', 'Town': 'nature',
  'Nature Preserve': 'nature',
  // spiritual
  'Temple': 'spiritual', 'Hindu Temple': 'spiritual',
  'Buddhist Temple': 'spiritual', 'Monastery': 'spiritual',
  'Church': 'spiritual', 'Mosque': 'spiritual', 'Shrine': 'spiritual',
  'Spiritual Center': 'spiritual',
  // heritage
  'Historic and Protected Site': 'heritage', 'History Museum': 'heritage',
  'Monument': 'heritage', 'Art Museum': 'heritage', 'Museum': 'heritage',
  'Art Gallery': 'heritage', 'Castle': 'heritage', 'Palace': 'heritage',
  // vibe
  'Movie Theater': 'vibe', 'Nightclub': 'vibe',
  'Concert Hall': 'vibe', 'Theater': 'vibe',
  'Arts and Entertainment': 'vibe', 'Stadium': 'vibe',
  'Amusement Park': 'vibe', 'Cricket Ground': 'vibe',
  // shopping
  'Shopping Mall': 'shopping', 'Market': 'shopping', 'Plaza': 'shopping',
  'Neighborhood': 'shopping', 'Miscellaneous Store': 'shopping',
  'Store': 'shopping', 'Department Store': 'shopping',
  'Mobile Phone Store': 'shopping', 'Hardware Store': 'shopping',
  'Boutique': 'shopping', 'Clothing Store': 'shopping',
  'Flea Market': 'shopping',
};

function resolveBucket(p) {
  if (p.source === 'fsq') {
    return FSQ_CATEGORY_BUCKET[p.fsqCategory] || 'place';
  }
  const tags = p.cultureTags || [];
  if (tags.length === 0) return 'place';
  const set = new Set(tags);
  for (const { bucket, tags: list } of AIRTABLE_TAG_PRIORITY) {
    for (const t of list) if (set.has(t)) return bucket;
  }
  return 'place';
}

// ---------- helpers

function isFiniteCoord(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Approximate distance in meters using equirectangular projection (good enough
// for ≤100m proximity tests near the equator; latitude-corrected so it stays
// reasonable elsewhere).
function approxDistanceM(latA, lonA, latB, lonB) {
  const R = 6371000;
  const dLat = ((latB - latA) * Math.PI) / 180;
  const dLon = ((lonB - lonA) * Math.PI) / 180;
  const meanLat = ((latA + latB) / 2) * (Math.PI / 180);
  const x = dLon * Math.cos(meanLat);
  const y = dLat;
  return Math.sqrt(x * x + y * y) * R;
}

function round5(n) { return Math.round(n * 1e5) / 1e5; }

// ---------- args

const args = process.argv.slice(2);
function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

const inputPath = resolve(
  argVal('--input') || resolve(REPO_ROOT, '..', '..', 'poi_cache.json'),
);
const outputPath = resolve(
  argVal('--output')
    || resolve(REPO_ROOT, 'apps/website/public/pois.geojson'),
);
const NEAR_PROPERTY_M = 60;

// ---------- main

async function fetchProperties() {
  const res = await fetch('https://api.zostel.com/api/v1/stay/operators/', {
    headers: {
      'Client-App-Id': '5Njb5awMk0dbC7VNnY7Z35tw2yEE1HtA92r9YA1t',
      'accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`operators API ${res.status}`);
  const json = await res.json();
  const ops = (json.operators || [])
    .map((o) => ({ lat: o.latitude, lon: o.longitude }))
    .filter((p) => isFiniteCoord(p.lat, p.lon));
  return ops;
}

async function main() {
  console.log(`reading ${inputPath}`);
  const raw = JSON.parse(await readFile(inputPath, 'utf8'));

  console.log('fetching property coords from Zostel operators API…');
  const properties = await fetchProperties();
  console.log(`  ${properties.length} property anchors`);

  const features = [];
  const histo = { food: 0, nature: 0, spiritual: 0, heritage: 0, shopping: 0, vibe: 0, place: 0 };
  let dropped_coords = 0;
  let dropped_dup_fsq = 0;
  let dropped_dup_coord = 0;
  let near_property = 0;
  let total_airtable = 0;
  let total_fsq = 0;
  const unmatchedFsq = new Map();

  for (const [destName, dest] of Object.entries(raw)) {
    if (!dest || typeof dest !== 'object') continue;

    const seenFsq = new Set();
    const seenCoord = new Set(); // 4-decimal grid; airtable wins

    /** @type {Array<{
     *  id: string, name: string, lat: number, lon: number, bucket: string,
     *  source: 'airtable'|'fsq', cat?: string,
     * }>} */
    const localPois = [];

    // First pass: airtable from .pois[]
    for (const p of dest.pois || []) {
      if (p.source !== 'airtable') continue;
      const lat = +p.lat, lon = +p.lon;
      if (!isFiniteCoord(lat, lon)) { dropped_coords++; continue; }
      const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (seenCoord.has(key)) { dropped_dup_coord++; continue; }
      seenCoord.add(key);
      const bucket = resolveBucket({
        source: 'airtable',
        cultureTags: Array.isArray(p.culture_tags) ? p.culture_tags : [],
      });
      total_airtable++;
      histo[bucket]++;
      localPois.push({
        id: `a:${p.airtable_id || `${destName}|${p.name}`}`,
        name: String(p.name || '').slice(0, 200),
        lat, lon, bucket, source: 'airtable',
      });
    }

    // Second pass: FSQ items inline in .pois[] (no `source` field, has fsq_place_id)
    for (const p of dest.pois || []) {
      if (p.source === 'airtable') continue;
      if (!p.fsq_place_id) continue;
      if (seenFsq.has(p.fsq_place_id)) { dropped_dup_fsq++; continue; }
      seenFsq.add(p.fsq_place_id);
      const lat = +p.lat, lon = +p.lon;
      if (!isFiniteCoord(lat, lon)) { dropped_coords++; continue; }
      const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (seenCoord.has(key)) { dropped_dup_coord++; continue; }
      seenCoord.add(key);
      const bucket = resolveBucket({ source: 'fsq', fsqCategory: p.category });
      if (bucket === 'place' && p.category)
        unmatchedFsq.set(p.category, (unmatchedFsq.get(p.category) || 0) + 1);
      total_fsq++;
      histo[bucket]++;
      localPois.push({
        id: `f:${p.fsq_place_id}`,
        name: String(p.name || '').slice(0, 200),
        lat, lon, bucket, source: 'fsq',
        cat: p.category || undefined,
      });
    }

    // Third pass: separate .pois_fsq[] list
    for (const p of dest.pois_fsq || []) {
      if (!p.fsq_place_id) continue;
      if (seenFsq.has(p.fsq_place_id)) { dropped_dup_fsq++; continue; }
      seenFsq.add(p.fsq_place_id);
      const lat = +p.lat, lon = +p.lon;
      if (!isFiniteCoord(lat, lon)) { dropped_coords++; continue; }
      const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (seenCoord.has(key)) { dropped_dup_coord++; continue; }
      seenCoord.add(key);
      const bucket = resolveBucket({ source: 'fsq', fsqCategory: p.category });
      if (bucket === 'place' && p.category)
        unmatchedFsq.set(p.category, (unmatchedFsq.get(p.category) || 0) + 1);
      total_fsq++;
      histo[bucket]++;
      localPois.push({
        id: `f:${p.fsq_place_id}`,
        name: String(p.name || '').slice(0, 200),
        lat, lon, bucket, source: 'fsq',
        cat: p.category || undefined,
      });
    }

    for (const poi of localPois) {
      let nearProp = false;
      for (const pr of properties) {
        if (approxDistanceM(poi.lat, poi.lon, pr.lat, pr.lon) <= NEAR_PROPERTY_M) {
          nearProp = true;
          break;
        }
      }
      if (nearProp) near_property++;

      const props = {
        id: poi.id,
        name: poi.name,
        cluster: poi.bucket,
        source: poi.source,
        dest: destName,
      };
      if (poi.cat) props.cat = poi.cat;
      if (nearProp) props.near_property = true;

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [round5(poi.lon), round5(poi.lat)] },
        properties: props,
      });
    }
  }

  const fc = { type: 'FeatureCollection', features };
  await writeFile(outputPath, JSON.stringify(fc));
  const sizeKb = Math.round(Buffer.byteLength(JSON.stringify(fc)) / 1024);

  console.log('\n=== build-pois done ===');
  console.log(`features written:    ${features.length}`);
  console.log(`  airtable:          ${total_airtable}`);
  console.log(`  fsq:               ${total_fsq}`);
  console.log(`dropped (bad coord): ${dropped_coords}`);
  console.log(`dropped (dup fsq):   ${dropped_dup_fsq}`);
  console.log(`dropped (dup coord): ${dropped_dup_coord}`);
  console.log(`near_property:       ${near_property}`);
  console.log(`output:              ${outputPath}`);
  console.log(`raw size:            ${sizeKb} KB`);
  console.log('\nbucket distribution:');
  for (const [bucket, n] of Object.entries(histo)) {
    const pct = features.length > 0 ? ((n / features.length) * 100).toFixed(1) : '0';
    console.log(`  ${bucket.padEnd(10)} ${String(n).padStart(5)}  (${pct}%)`);
  }
  if (unmatchedFsq.size > 0) {
    console.log(`\ntop unmatched FSQ categories (→ place fallback):`);
    const sorted = [...unmatchedFsq.entries()].sort((a, b) => b[1] - a[1]);
    for (const [cat, n] of sorted.slice(0, 15)) {
      console.log(`  ${String(n).padStart(4)}  ${cat}`);
    }
  }
}

main().catch((e) => {
  console.error('build-pois failed:', e);
  process.exit(1);
});
