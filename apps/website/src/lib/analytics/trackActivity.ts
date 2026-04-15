/**
 * Lightweight activity logger for apps/website.
 *
 * Tracks passport views, share-quest clicks, and other user-facing
 * engagement signals that feed Erum's PRD "activity logging" requirement.
 *
 * Routes events to PostHog when NEXT_PUBLIC_POSTHOG_KEY is set; silently
 * no-ops otherwise so local dev, preview deploys, and prod-without-keys
 * all work identically without crashing or blocking the UI.
 *
 * Follows the feedback rule: zozozo.work has only Zo API + Zostel API as
 * user-data backends. Analytics/telemetry via a third-party (PostHog) is
 * the sanctioned path — never Supabase for user behavior data.
 *
 * Intentionally smaller than the apps/house analytics contract. When
 * someone ports the full typed-event-contract + fan-out to a shared lib,
 * this file should graduate to the shared lib and be deleted.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The canonical set of events the website fires. Extend as new tracking
 * needs surface. Keeping this union tight prevents typo-driven event
 * names from polluting PostHog dashboards.
 */
export type WebsiteEventName =
  | "passport_view"
  | "passport_share_quest_click"
  | "passport_copy_link"
  | "passport_ig_story_download"
  | "passport_ig_story_shared";

export interface PassportViewProps {
  handle: string;
  is_own_passport: boolean;
  is_logged_in: boolean;
  referrer?: string | null;
}

export interface ShareQuestClickProps {
  handle: string;
  destination: "copy_link" | "ig_bio" | "ig_story" | "whatsapp" | "whatsapp_status";
}

type EventPropsMap = {
  passport_view: PassportViewProps;
  passport_share_quest_click: ShareQuestClickProps;
  passport_copy_link: { handle: string };
  passport_ig_story_download: { handle: string };
  passport_ig_story_shared: { handle: string };
};

let posthogClient: any = null;
let initAttempted = false;

async function getPosthog(): Promise<any | null> {
  if (posthogClient) return posthogClient;
  if (initAttempted) return null;
  initAttempted = true;

  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  try {
    const mod = await import("posthog-js");
    const posthog = mod.default;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: false,
      loaded: () => {
        // No-op — we manually capture events below.
      },
    });
    posthogClient = posthog;
    return posthog;
  } catch {
    // posthog-js failed to load — drop events silently.
    return null;
  }
}

/**
 * Fire an activity event. Returns a promise that resolves once the event
 * is queued (not necessarily delivered). Safe to fire-and-forget with
 * `void trackActivity(...)`.
 */
export async function trackActivity<E extends WebsiteEventName>(
  event: E,
  props: EventPropsMap[E],
): Promise<void> {
  try {
    const posthog = await getPosthog();
    if (!posthog) return;
    posthog.capture(event, props);
  } catch {
    // Never let analytics failures bubble into UI code.
  }
}

/**
 * Identify the current user once authentication lands. Idempotent —
 * safe to call on every render; PostHog dedupes by distinct_id.
 */
export async function identifyUser(
  zoPid: string,
  traits?: Record<string, string | number | boolean | null>,
): Promise<void> {
  if (!zoPid) return;
  try {
    const posthog = await getPosthog();
    if (!posthog) return;
    posthog.identify(zoPid, traits);
  } catch {
    /* noop */
  }
}

/**
 * Reset identity on logout so the next user doesn't inherit traits.
 */
export async function resetIdentity(): Promise<void> {
  try {
    const posthog = await getPosthog();
    if (!posthog) return;
    posthog.reset();
  } catch {
    /* noop */
  }
}
