export type ConsentCategory =
  | "ad_storage"
  | "analytics_storage"
  | "ad_user_data"
  | "ad_personalization";

export type ConsentValue = "granted" | "denied";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let currentState: Record<ConsentCategory, ConsentValue> = {
  ad_storage: "granted",
  analytics_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
};

function callGtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  // gtag is defined inline in _document.tsx as part of the consent default block,
  // BEFORE GA4 loads. If it's missing (e.g. GA4 env var not set), no-op.
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

export function initConsent(): void {
  // The DEFAULT consent state is also pushed inline in _document.tsx so it
  // applies before SDKs load. This call mirrors that for runtime/test paths.
  callGtag("consent", "default", { ...currentState, wait_for_update: 500 });
}

export function updateConsent(
  partial: Partial<Record<ConsentCategory, ConsentValue>>
): void {
  currentState = { ...currentState, ...partial };
  callGtag("consent", "update", partial);
}

export function hasConsent(category: ConsentCategory): boolean {
  return currentState[category] === "granted";
}
