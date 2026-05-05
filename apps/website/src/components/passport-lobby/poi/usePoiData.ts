import { useEffect, useState } from 'react';

// Same module-cache pattern as useZostelOperators — first open pays the
// fetch, subsequent opens are instant.
let cache: GeoJSON.FeatureCollection | null = null;
let inflight: Promise<GeoJSON.FeatureCollection> | null = null;

const POIS_URL = '/api/pois.geojson';

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

/** Lazy-loads the POI GeoJSON from the Supabase-backed API route.
 * Enabled-gated so the modal only fetches once it's actually opened. */
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
