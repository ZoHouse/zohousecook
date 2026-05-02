import { useEffect, useState } from 'react';

// Same module-cache pattern as useZostelOperators — first open pays the
// fetch, subsequent opens are instant.
let cache: GeoJSON.FeatureCollection | null = null;
let inflight: Promise<GeoJSON.FeatureCollection> | null = null;

// TODO(infra): swap back to a relative `/pois.geojson` path served from
// apps/website/public/ once the zozozo.work public-folder serving is fixed.
// Today every file in that folder 404s on production (favicon, manifest, etc.),
// matching the workaround in commit 28d3bd5 that moved PWA assets to cdn.zo.xyz.
// Re-uploading the asset: see scripts/build-pois.mjs + the upload curl in
// memory `reference_zo_cdn_gallery_upload.md`.
const POIS_URL =
  'https://cdn.zo.xyz/gallery/media/documents/b2054b83-1bb5-41b6-8bd4-2a23377bc923_20260502044259.geojson';

function fetchPois(): Promise<GeoJSON.FeatureCollection> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(POIS_URL, { headers: { accept: 'application/json' } })
    .then((r) => {
      if (!r.ok) throw new Error(`pois.geojson ${r.status}`);
      return r.json() as Promise<GeoJSON.FeatureCollection>;
    })
    .then((fc) => {
      cache = fc;
      return fc;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Lazy-loads the static POI GeoJSON. Enabled-gated so the modal only fetches
 * once it's actually opened. Module-level cache makes re-opens free. */
export function usePoiData(enabled: boolean) {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(cache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || data) return;
    let cancelled = false;
    fetchPois()
      .then((fc) => {
        if (!cancelled) setData(fc);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, data]);

  return { data, loading: !data && !error, error };
}
