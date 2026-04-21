import { useEffect, useState } from 'react';

export type ZostelTypeCode = 'H' | 'B' | 'P' | 'HO' | 'S' | string;

export interface ZostelOperator {
  code: string;
  name: string;
  slug?: string;
  latitude: number;
  longitude: number;
  address?: string;
  type_code?: ZostelTypeCode;
  destination?: { name?: string; code?: string; country?: string };
}

const ZOSTEL_OPERATORS_ENDPOINT = 'https://api.zostel.com/api/v1/stay/operators/';
// Public Zostel app identifier — same value the zostel.com web client uses.
const ZOSTEL_APP_ID = process.env.ZOSTEL_APP_ID || '5Njb5awMk0dbC7VNnY7Z35tw2yEE1HtA92r9YA1t';

let cache: ZostelOperator[] | null = null;
let inflight: Promise<ZostelOperator[]> | null = null;

function fetchOperators(): Promise<ZostelOperator[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(ZOSTEL_OPERATORS_ENDPOINT, {
    headers: { 'Client-App-Id': ZOSTEL_APP_ID },
  })
    .then((r) => r.json())
    .then((json: { operators?: ZostelOperator[] }) => {
      const ops = json.operators ?? [];
      cache = ops;
      return ops;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Fetches the live Zostel operators list (106+ properties with precise
 * lat/lng). Enabled-gated so the modal only hits the API when opened.
 * Module-level cache — subsequent opens reuse the first response.
 */
export function useZostelOperators(enabled: boolean) {
  const [operators, setOperators] = useState<ZostelOperator[] | null>(cache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || operators) return;
    let cancelled = false;
    fetchOperators()
      .then((ops) => {
        if (!cancelled) setOperators(ops);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, operators]);

  return { operators, loading: !operators && !error, error };
}
