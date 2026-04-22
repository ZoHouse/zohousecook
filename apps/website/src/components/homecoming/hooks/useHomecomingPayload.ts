// apps/website/src/components/homecoming/hooks/useHomecomingPayload.ts

import { useEffect, useState } from "react";
import { fetchHomecomingPayload } from "../../../lib/homecoming/endpoints";
import type { HomecomingPayload } from "../types";

interface State {
  payload: HomecomingPayload | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetches the homecoming payload once on mount. We can't use SWR here because
 * the page is SSR'd with the payload already in props — this hook only runs
 * client-side if the page was given a null payload (edge case: 5xx on SSR).
 * In the happy path, components read payload from props, not from this hook.
 */
export function useHomecomingPayload(initial: HomecomingPayload | null): State {
  const [state, setState] = useState<State>({
    payload: initial,
    loading: initial === null,
    error: null,
  });

  useEffect(() => {
    if (initial !== null) return;
    let cancelled = false;
    fetchHomecomingPayload()
      .then((payload) => {
        if (!cancelled) setState({ payload, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ payload: null, loading: false, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return state;
}
