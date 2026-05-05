#!/usr/bin/env node
// One-shot seed: snapshot/airtable.json + snapshot/fsq.json → Supabase pois table.
// Pictures uploaded to Zo CDN inline. Resume-safe via source_ref lookup.
//
// USAGE:
//   AIRTABLE_PAT=... ZO_SESSION=... node scripts/04-seed-pois.mjs [--dry-run] [--limit N] [--skip-pics] [--source airtable|foursquare]

import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

// ============================================================================
// CONFIG
// ============================================================================
const SNAP_DIR        = "/Users/samuraizan/zo-world/data/pois-snapshot";
const DATA_DIR        = "/Users/samuraizan/conductor/workspaces/zo.xyz/marseille/data/pois";
const SUPABASE_URL    = "https://elvaqxadfewcsohrswsi.supabase.co";
const ZO_API_BASE     = "https://api.io.zo.xyz";
const PIC_CONCURRENCY = 3;          // gallery upload parallelism
const INSERT_BATCH    = 100;        // POIs per Supabase batch insert
const RETRY_MAX       = 5;
const META_TAGS       = new Set(["Photography", "Stories & Journals", "Design", "Follow your Heart"]);

// ============================================================================
// CREDS
// ============================================================================
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY required"); process.exit(1); }

const SESSION = JSON.parse(fs.readFileSync("/Users/samuraizan/zo-world/.zo-session.json", "utf8"));
const ZO_TOKEN = SESSION.zo?.token || SESSION.token;
const ZO_DID   = SESSION.zo?.device_id || SESSION.device_id;
const ZO_DS    = SESSION.zo?.device_secret || SESSION.device_secret;
const ZO_CK    = SESSION.zo?.client_key || SESSION.client_key;
const zoHeaders = {
  "Authorization": `Bearer ${ZO_TOKEN}`,
  "client-device-id": ZO_DID,
  "client-device-secret": ZO_DS,
  "client-key": ZO_CK,
};

// ============================================================================
// CLI
// ============================================================================
const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i+1] : null; };
const DRY_RUN   = args.includes("--dry-run");
const SKIP_PICS = args.includes("--skip-pics");
const LIMIT     = parseInt(argVal("--limit") || "0", 10);
const ONLY_SRC  = argVal("--source"); // airtable | foursquare | null

// ============================================================================
// HELPERS
// ============================================================================
function parseCoords(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lon = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function pictureFiles(recId) {
  // Returns sorted [ {idx, path, ext} ] from snapshot/pictures
  const dir = path.join(SNAP_DIR, "pictures");
  const prefix = `${recId}_`;
  const matches = fs.readdirSync(dir)
    .filter(f => f.startsWith(prefix))
    .map(f => {
      const m = f.match(/_(\d+)\.([a-z0-9]+)$/i);
      return m ? { idx: parseInt(m[1], 10), path: path.join(dir, f), ext: m[2].toLowerCase() } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx);
  return matches;
}

let cachedAllFiles = null;
function pictureFilesFast(recId) {
  // Avoid re-readdir per record (5k records × 7k files = pain). Build map once.
  if (!cachedAllFiles) {
    cachedAllFiles = new Map();
    const dir = path.join(SNAP_DIR, "pictures");
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(rec[A-Za-z0-9]+)_(\d+)\.([a-z0-9]+)$/i);
      if (!m) continue;
      const [, recId, idxStr, ext] = m;
      const arr = cachedAllFiles.get(recId) || [];
      arr.push({ idx: parseInt(idxStr, 10), path: path.join(dir, f), ext: ext.toLowerCase() });
      cachedAllFiles.set(recId, arr);
    }
    for (const arr of cachedAllFiles.values()) arr.sort((a, b) => a.idx - b.idx);
  }
  return cachedAllFiles.get(recId) || [];
}

async function uploadPicture(filePath) {
  const buf = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const ext = filename.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : "image/jpeg";

  for (let attempt = 0; attempt < RETRY_MAX; attempt++) {
    try {
      const fd = new FormData();
      fd.append("category", "image");
      fd.append("file", new Blob([buf], { type: mime }), filename);
      const r = await fetch(`${ZO_API_BASE}/api/v1/gallery/media/`, {
        method: "POST", headers: zoHeaders, body: fd, signal: AbortSignal.timeout(60000),
      });
      if (r.status === 429) {
        const ra = parseInt(r.headers.get("retry-after") || "10", 10);
        console.warn(`  429 from gallery, sleep ${ra}s`);
        await sleep(ra * 1000); continue;
      }
      if (!r.ok) throw new Error(`gallery ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      return j.url || j.image;
    } catch (e) {
      if (attempt === RETRY_MAX - 1) throw e;
      const wait = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`  upload retry ${attempt+1} after ${(wait/1000).toFixed(1)}s: ${String(e).slice(0,120)}`);
      await sleep(wait);
    }
  }
  throw new Error("uploadPicture: exhausted retries");
}

// Concurrent picture uploader with cap
async function uploadPicturesParallel(picFiles) {
  const results = new Array(picFiles.length).fill(null);
  let i = 0;
  const workers = Array.from({ length: Math.min(PIC_CONCURRENCY, picFiles.length) }, async () => {
    while (i < picFiles.length) {
      const my = i++;
      try { results[my] = await uploadPicture(picFiles[my].path); }
      catch (e) {
        console.warn(`  pic ${picFiles[my].path} FAILED: ${String(e).slice(0,160)}`);
        results[my] = null;
      }
    }
  });
  await Promise.all(workers);
  return results.filter(Boolean);
}

// Supabase REST insert (bypasses RLS via service role)
async function supabaseInsert(rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/pois`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`supabase insert ${r.status}: ${(await r.text()).slice(0, 400)}`);
}

async function loadDoneRefs() {
  // Pull existing source_ref values so we can skip already-inserted records on resume.
  const done = new Set();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/pois?select=source_ref`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Range": `${from}-${from+PAGE-1}`, "Range-Unit": "items" },
    });
    if (!r.ok) throw new Error(`supabase select source_ref ${r.status}: ${await r.text()}`);
    const rows = await r.json();
    for (const row of rows) if (row.source_ref) done.add(row.source_ref);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return done;
}

// ============================================================================
// LOAD SOURCES
// ============================================================================
console.log("Loading snapshot + culture resolutions…");
const at = JSON.parse(fs.readFileSync(`${SNAP_DIR}/airtable.json`, "utf8"));
const fsq = JSON.parse(fs.readFileSync(`${SNAP_DIR}/fsq.json`, "utf8"));
const rules = JSON.parse(fs.readFileSync(`${DATA_DIR}/rules-resolved.json`, "utf8"));
const llm = JSON.parse(fs.readFileSync(`${DATA_DIR}/llm-resolutions.json`, "utf8"));
const fsqRes = JSON.parse(fs.readFileSync(`${DATA_DIR}/fsq-resolved.json`, "utf8"));

// Build culture key → uuid map (single round-trip to Supabase)
console.log("Fetching culture id↔key map…");
const cMapRes = await fetch(`${SUPABASE_URL}/rest/v1/cultures?select=id,key`, {
  headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
});
if (!cMapRes.ok) { console.error(`cultures fetch failed ${cMapRes.status}: ${await cMapRes.text()}`); process.exit(1); }
const cArr = await cMapRes.json();
const cultureKey2Id = Object.fromEntries(cArr.map(c => [c.key, c.id]));
console.log(`  ${Object.keys(cultureKey2Id).length} cultures available`);

// Build airtable rec_id → culture_key map
const atCulture = {};
for (const r of rules) atCulture[r.id] = r.culture;
for (const [k, v] of Object.entries(llm)) { if (k !== "_meta") atCulture[k] = v; }

// Build fsq_place_id → culture_key map
const fsqCulture = Object.fromEntries(fsqRes.map(r => [r.fsq_place_id, r.culture]));

// ============================================================================
// MAIN
// ============================================================================
const startedAt = new Date();
console.log(`\n=== SEED START (${startedAt.toISOString()}) ===`);
if (DRY_RUN)   console.log("  --dry-run mode (no inserts, no uploads)");
if (SKIP_PICS) console.log("  --skip-pics mode (no CDN uploads, pictures[] will be empty)");
if (LIMIT)     console.log(`  --limit ${LIMIT}`);
if (ONLY_SRC)  console.log(`  --source ${ONLY_SRC}`);

const doneRefs = DRY_RUN ? new Set() : await loadDoneRefs();
console.log(`  ${doneRefs.size} records already in pois table (will skip)\n`);

// Build job list
const jobs = [];

if (!ONLY_SRC || ONLY_SRC === "airtable") {
  for (const r of at) {
    if (doneRefs.has(r.id)) continue;
    const f = r.fields;
    const coords = parseCoords(f["Treasure box coordinates"]);
    if (!coords) continue; // skip rows without valid coords
    const cultureKey = atCulture[r.id] || "follow-your-heart";
    const cultureId = cultureKey2Id[cultureKey];
    if (!cultureId) { console.warn(`  ${r.id} unknown culture key '${cultureKey}', skipping`); continue; }
    const isEvent = r._source_table === "Quests - Seasonal";
    jobs.push({
      kind: "airtable",
      source_ref: r.id,
      row: {
        source: "airtable",
        source_ref: r.id,
        name: (f["Name your Quest"] || "(unnamed)").trim().slice(0, 500),
        description: (f["Description of Quest (140 characters)"] || "").trim() || null,
        location: `SRID=4326;POINT(${coords.lon} ${coords.lat})`,
        destination: f["Destination Name"] || null,
        country: f["Country Name"] || null,
        state: f["State Name"] || null,
        culture_id: cultureId,
        culture_key: cultureKey,
        fsq_category: null,
        pictures: [],          // filled after upload
        hero_picture: null,
        quest_master: f["Quest Master Name"] || null,
        nearest_airport: f["Nearest Airport Name"] || null,
        airport_distance_km: f["Airport distance from Treasure box (km)"] ?? null,
        nearest_railway: f["Nearest Railway Station Name"] || null,
        railway_distance_km: f["Railway Station distance from treasure box"] ?? null,
        nearest_bus: f["Nearest Bus Station Name"] || null,
        bus_distance_km: f["Bus Station distance from treasure box"] ?? null,
        money_required: f["Money Requirements"] || null,
        is_event: isEvent,
        event_start: null, event_end: null,    // schema has these but Airtable doesn't expose in current shape
      },
      picFiles: SKIP_PICS ? [] : pictureFilesFast(r.id),
    });
  }
}

if (!ONLY_SRC || ONLY_SRC === "foursquare") {
  for (const p of fsq) {
    if (doneRefs.has(p.fsq_place_id)) continue;
    if (typeof p.lat !== "number" || typeof p.lon !== "number") continue;
    const cultureKey = fsqCulture[p.fsq_place_id] || "follow-your-heart";
    const cultureId = cultureKey2Id[cultureKey];
    if (!cultureId) continue;
    jobs.push({
      kind: "foursquare",
      source_ref: p.fsq_place_id,
      row: {
        source: "foursquare",
        source_ref: p.fsq_place_id,
        name: (p.name || "(unnamed)").slice(0, 500),
        description: null,
        location: `SRID=4326;POINT(${p.lon} ${p.lat})`,
        destination: p.destination || null,
        country: p.country || null,
        state: null,
        culture_id: cultureId,
        culture_key: cultureKey,
        fsq_category: p.category || null,
        pictures: [],
        hero_picture: null,
        // Airtable-only fields included as null so PostgREST batch insert sees uniform keys
        quest_master: null,
        nearest_airport: null,
        airport_distance_km: null,
        nearest_railway: null,
        railway_distance_km: null,
        nearest_bus: null,
        bus_distance_km: null,
        money_required: null,
        is_event: false,
        event_start: null,
        event_end: null,
      },
      picFiles: [],
    });
  }
}

const totalJobs = LIMIT ? Math.min(LIMIT, jobs.length) : jobs.length;
const work = jobs.slice(0, totalJobs);
const totalPics = work.reduce((sum, j) => sum + j.picFiles.length, 0);
console.log(`Jobs: ${work.length} POIs to insert (${totalPics} pics to upload)`);
if (DRY_RUN) {
  console.log("\n=== DRY RUN: sample 3 jobs ===");
  for (const j of work.slice(0, 3)) console.log(`  [${j.kind}] ${j.source_ref}  ${j.row.name.slice(0,60)}  → ${j.row.culture_key}  pics:${j.picFiles.length}`);
  console.log("\nDone (no inserts).");
  process.exit(0);
}

// ============================================================================
// EXECUTE
// ============================================================================
const t0 = Date.now();
let processed = 0, picUploaded = 0, picFailed = 0, inserted = 0;
let batch = [];

async function flushBatch() {
  if (!batch.length) return;
  await supabaseInsert(batch);
  inserted += batch.length;
  batch = [];
}

for (const job of work) {
  // Upload pics for this record (concurrent within record; serial across records to keep memory tame)
  if (job.picFiles.length > 0) {
    const urls = await uploadPicturesParallel(job.picFiles);
    picUploaded += urls.length;
    picFailed += (job.picFiles.length - urls.length);
    job.row.pictures = urls;
    job.row.hero_picture = urls[0] || null;
  }
  batch.push(job.row);
  processed++;

  if (batch.length >= INSERT_BATCH) await flushBatch();

  if (processed % 50 === 0) {
    const elapsed = (Date.now() - t0) / 1000;
    const rate = processed / elapsed;
    const eta = (work.length - processed) / rate;
    console.log(`[${processed}/${work.length}] inserted=${inserted}, pics ok=${picUploaded} fail=${picFailed}, ${rate.toFixed(2)}/s, ETA ${(eta/60).toFixed(1)}min`);
  }
}
await flushBatch();

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n=== DONE in ${elapsed}s ===`);
console.log(`  POIs inserted:   ${inserted}`);
console.log(`  Pictures up:     ${picUploaded}`);
console.log(`  Pictures fail:   ${picFailed}`);
console.log(`  Started:         ${startedAt.toISOString()}`);
console.log(`  Finished:        ${new Date().toISOString()}`);
