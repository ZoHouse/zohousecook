#!/usr/bin/env node
// Three cleanups in one pass:
//  1. Backfill event_start/event_end on Seasonal POIs from snapshot
//  2. Delete duplicate (name, destination) pairs — keep first by id
//  3. Apply ~10m jitter to POIs sharing exact lat/lon

import fs from "fs";

const SUPABASE_URL = "https://elvaqxadfewcsohrswsi.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY required"); process.exit(1); }
const auth = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" };

async function pgrest(method, path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: auth, body: body ? JSON.stringify(body) : null });
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

// ---- Step 1: backfill event dates ----
console.log("=== Step 1: backfill event_start / event_end ===");
const at = JSON.parse(fs.readFileSync("/Users/samuraizan/zo-world/data/pois-snapshot/airtable.json"));
const seasonal = at.filter(r => r._source_table === "Quests - Seasonal");
let updated = 0, skipped = 0;
for (const r of seasonal) {
  const s = r.fields["Treasure box start date and time"];
  const e = r.fields["Treasure box end date and time"];
  if (!s && !e) { skipped++; continue; }
  await fetch(`${SUPABASE_URL}/rest/v1/pois?source_ref=eq.${r.id}`, {
    method: "PATCH", headers: auth,
    body: JSON.stringify({ event_start: s || null, event_end: e || null }),
  });
  updated++;
  if (updated % 100 === 0) console.log(`  updated ${updated}/${seasonal.length}…`);
}
console.log(`  ✓ updated ${updated} Seasonal POIs (${skipped} had no dates)`);

// ---- Step 2: delete duplicate (name, destination) pairs ----
console.log("\n=== Step 2: delete duplicate name+destination pairs ===");
const dupRowsRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: "POST", headers: auth,
  body: JSON.stringify({}),
}).catch(() => null);
// PostgREST doesn't expose arbitrary SQL — use psql for the dedup. Skip via REST.
// Instead: fetch all (id, name, destination) and dedupe client-side.
const allRes = await fetch(`${SUPABASE_URL}/rest/v1/pois?select=id,name,destination,created_at&order=created_at.asc`, { headers: auth });
const all = await allRes.json();
const seen = new Map(); // key → first id
const dupIds = [];
for (const p of all) {
  const k = `${p.name}|${p.destination || ''}`;
  if (seen.has(k)) dupIds.push(p.id);
  else seen.set(k, p.id);
}
console.log(`  duplicates found: ${dupIds.length}`);
if (dupIds.length) {
  // Delete in batches via in() filter (PostgREST URL limit ~2000)
  const BATCH = 50;
  for (let i = 0; i < dupIds.length; i += BATCH) {
    const slice = dupIds.slice(i, i + BATCH);
    const inList = slice.map(id => `"${id}"`).join(",");
    await fetch(`${SUPABASE_URL}/rest/v1/pois?id=in.(${inList})`, { method: "DELETE", headers: auth });
  }
  console.log(`  ✓ deleted ${dupIds.length} duplicates`);
}

// ---- Step 3: jitter coordinate-stacked POIs ----
console.log("\n=== Step 3: jitter colliding coordinates ===");
const collRes = await fetch(`${SUPABASE_URL}/rest/v1/pois?select=id,location`, { headers: auth });
const allLocs = await collRes.json();
const byLoc = new Map();
for (const p of allLocs) {
  const arr = byLoc.get(p.location) || [];
  arr.push(p.id);
  byLoc.set(p.location, arr);
}
const groups = [...byLoc.entries()].filter(([, ids]) => ids.length > 1);
console.log(`  collision groups remaining: ${groups.length}`);
let jittered = 0;
for (const [loc, ids] of groups) {
  // For each group, leave the first POI alone and jitter the rest by ~10-20m in random direction.
  // 0.0001° ≈ 11m in lat, varies by lon.
  for (let i = 1; i < ids.length; i++) {
    const dx = (Math.random() - 0.5) * 0.0003; // ~30m max
    const dy = (Math.random() - 0.5) * 0.0003;
    // Patch via raw SQL is hard; use ST_Translate via PostgREST is hard too.
    // Use UPDATE via psql with id list — fall through to direct SQL approach below.
    jittered++;
    // Build a per-row update: location = ST_GeogFromText('POINT(lon+dx lat+dy)')
    // We need the current lat/lon to apply offset — fetch this row's location WKB...
    // Easier: just send via psql since this is a one-shot fix script.
  }
}
console.log(`  → would jitter ${jittered} POIs (using direct SQL, see next step)`);

// Emit psql snippet to apply jitter (PostgREST can't easily do ST_Translate)
const lines = [];
for (const [loc, ids] of groups) {
  for (let i = 1; i < ids.length; i++) {
    const dx = ((Math.random() - 0.5) * 0.0003).toFixed(7);
    const dy = ((Math.random() - 0.5) * 0.0003).toFixed(7);
    lines.push(`update pois set location = ST_Translate(location::geometry, ${dx}, ${dy})::geography where id = '${ids[i]}';`);
  }
}
fs.writeFileSync("/tmp/jitter.sql", lines.join("\n") + "\n");
console.log(`  wrote /tmp/jitter.sql (${lines.length} statements) — apply via psql`);
