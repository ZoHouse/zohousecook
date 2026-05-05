#!/usr/bin/env node
// One-shot: snapshot all Quest records + pictures from Airtable to local disk.
// Output: /Users/samuraizan/zo-world/data/pois-snapshot/{airtable.json, pictures/, manifest.json}
//
// Resume-safe: re-running skips records whose pictures already exist on disk.
// Rate-limited: 4 req/s on Airtable API, 5 concurrent picture downloads, retry x3.

import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

const PAT = process.env.AIRTABLE_PAT;
if (!PAT) { console.error("AIRTABLE_PAT env var required"); process.exit(1); }

const BASE = "applx7bOGlF8jUtQB";
const TABLES = ["Quests - Global", "Quests - India", "Quests - Seasonal", "Quests- Community"];
const OUT_DIR = "/Users/samuraizan/zo-world/data/pois-snapshot";
const PIC_DIR = path.join(OUT_DIR, "pictures");
const PIC_CONCURRENCY = 5;
const PIC_RETRIES = 3;
const API_MIN_INTERVAL_MS = 250; // 4 req/s

fs.mkdirSync(PIC_DIR, { recursive: true });

let lastApiCall = 0;
async function airtableGet(url) {
  const wait = API_MIN_INTERVAL_MS - (Date.now() - lastApiCall);
  if (wait > 0) await sleep(wait);
  lastApiCall = Date.now();
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${PAT}` } });
    if (r.status === 429) {
      const ra = parseInt(r.headers.get("retry-after") || "30", 10);
      console.warn(`  429 from Airtable, sleeping ${ra}s`);
      await sleep(ra * 1000);
      continue;
    }
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    return r.json();
  }
  throw new Error("Airtable: too many 429s");
}

async function fetchTable(name) {
  const recs = [];
  let offset = "";
  do {
    const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(name)}?pageSize=100${offset ? `&offset=${offset}` : ""}`;
    const j = await airtableGet(url);
    recs.push(...j.records);
    offset = j.offset || "";
  } while (offset);
  return recs;
}

async function downloadPic(url, destPath) {
  for (let attempt = 0; attempt < PIC_RETRIES; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(destPath, buf);
      return { ok: true, bytes: buf.length };
    } catch (e) {
      if (attempt === PIC_RETRIES - 1) return { ok: false, error: String(e) };
      await sleep(1000 * Math.pow(4, attempt) + Math.random() * 500);
    }
  }
}

function extFromUrl(url, filename) {
  const candidates = [filename, url];
  for (const s of candidates) {
    if (!s) continue;
    const m = s.match(/\.([a-z0-9]{2,5})(?:\?|$)/i);
    if (m) return m[1].toLowerCase();
  }
  return "jpg";
}

async function processPicQueue(jobs) {
  const results = { downloaded: 0, skipped: 0, failed: 0, bytes: 0, failures: [] };
  let i = 0;
  const workers = Array.from({ length: PIC_CONCURRENCY }, async () => {
    while (i < jobs.length) {
      const job = jobs[i++];
      if (fs.existsSync(job.dest)) { results.skipped++; continue; }
      // jitter to avoid synced bursts
      await sleep(Math.random() * 200);
      const r = await downloadPic(job.url, job.dest);
      if (r.ok) { results.downloaded++; results.bytes += r.bytes; }
      else { results.failed++; results.failures.push({ ...job, error: r.error }); }
      if ((results.downloaded + results.skipped + results.failed) % 100 === 0) {
        console.log(`  pics: ${results.downloaded} dl + ${results.skipped} skip + ${results.failed} fail / ${jobs.length}`);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// === MAIN ===
const startedAt = new Date();
console.log(`[${startedAt.toISOString()}] Snapshot starting → ${OUT_DIR}`);

// 1. Fetch all 4 tables
const all = {};
for (const t of TABLES) {
  console.log(`Fetching ${t}…`);
  all[t] = await fetchTable(t);
  console.log(`  ${all[t].length} records`);
}
const merged = Object.entries(all).flatMap(([table, recs]) =>
  recs.map(r => ({ ...r, _source_table: table }))
);
fs.writeFileSync(path.join(OUT_DIR, "airtable.json"), JSON.stringify(merged, null, 2));
console.log(`Wrote airtable.json (${merged.length} records, ${(fs.statSync(path.join(OUT_DIR, "airtable.json")).size / 1024 / 1024).toFixed(1)}MB)`);

// 2. Build picture download queue
const jobs = [];
for (const rec of merged) {
  const pics = rec.fields["Quest Pictures"] || [];
  pics.forEach((pic, idx) => {
    const ext = extFromUrl(pic.url, pic.filename);
    const dest = path.join(PIC_DIR, `${rec.id}_${idx}.${ext}`);
    jobs.push({ url: pic.url, dest, recId: rec.id, idx, filename: pic.filename });
  });
}
console.log(`\nDownloading ${jobs.length} pictures (concurrency ${PIC_CONCURRENCY})…`);

// 3. Run downloads
const t0 = Date.now();
const r = await processPicQueue(jobs);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// 4. Manifest
const manifest = {
  fetched_at: startedAt.toISOString(),
  finished_at: new Date().toISOString(),
  duration_seconds: parseFloat(elapsed),
  records: {
    total: merged.length,
    by_table: Object.fromEntries(Object.entries(all).map(([t, r]) => [t, r.length])),
  },
  pictures: {
    total_jobs: jobs.length,
    downloaded: r.downloaded,
    skipped: r.skipped,
    failed: r.failed,
    total_bytes: r.bytes,
    total_mb: +(r.bytes / 1024 / 1024).toFixed(1),
  },
  failures: r.failures.slice(0, 100), // cap to avoid mega manifest
  failures_truncated: r.failures.length > 100,
};
fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "fetched_at.txt"), startedAt.toISOString() + "\n");

console.log(`\n=== DONE in ${elapsed}s ===`);
console.log(`  records:    ${merged.length}`);
console.log(`  pictures:   ${r.downloaded} downloaded, ${r.skipped} skipped, ${r.failed} failed`);
console.log(`  total size: ${(r.bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`  manifest:   ${path.join(OUT_DIR, "manifest.json")}`);
