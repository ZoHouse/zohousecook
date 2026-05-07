"use client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

type TrackPayload = {
  bountyId?: string;
  source?: string;
  properties?: Record<string, unknown>;
};

/**
 * Fire-and-forget analytics. Failures are swallowed — tracking should never
 * break a click. Uses sendBeacon when available so it survives navigation.
 */
export function track(name: string, payload: TrackPayload = {}) {
  if (typeof window === "undefined") return;
  const url = `${basePath}/api/track`;
  const body = JSON.stringify({ name, ...payload });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* swallow */
  }
}
