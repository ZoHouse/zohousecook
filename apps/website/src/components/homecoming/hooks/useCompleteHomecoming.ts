// apps/website/src/components/homecoming/hooks/useCompleteHomecoming.ts

import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { completeHomecoming } from "../../../lib/homecoming/endpoints";

interface Options {
  replay: boolean;
}

/**
 * Fires the completion mutation (unless replay=true), then router.push('/passport').
 * Optimistic: router.push does not block on the response. Background retry
 * once on failure; second failure sends to Sentry (server reconciles on next
 * profile.me load). Server endpoint is idempotent via profile_id dedupe key.
 */
export function useCompleteHomecoming({ replay }: Options) {
  const router = useRouter();
  const [firing, setFiring] = useState(false);

  const complete = useCallback(async () => {
    if (firing) return;
    setFiring(true);

    // Kick off navigation immediately — the ceremony is over the moment tap
    // happens, the backend write is background bookkeeping.
    const nav = router.push("/passport");

    if (!replay) {
      completeHomecoming().catch(() => {
        // Retry once, quietly
        setTimeout(() => {
          completeHomecoming().catch((err) => {
            if (typeof window !== "undefined" && (window as any).Sentry) {
              (window as any).Sentry.captureException(err, {
                tags: { feature: "homecoming", phase: "complete-retry" },
              });
            }
          });
        }, 800);
      });
    }

    await nav;
  }, [firing, replay, router]);

  return { complete, firing };
}
