/**
 * Register the Zo World service worker.
 *
 * Runs only in the browser, and only when running on a real origin (not the
 * Next dev server). The SW is gated to production builds because dev HMR
 * doesn't play well with cached HTML.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production") return;

  // Don't register on Vercel preview deploys with the random hash domain —
  // it just clutters with stale caches per branch. Production aliases
  // (zozozo.work, zo.xyz) are the only places we want a persistent SW.
  const host = window.location.hostname;
  const isProductionHost =
    host === "zozozo.work" ||
    host === "www.zozozo.work" ||
    host === "zo.xyz" ||
    host === "www.zo.xyz";
  if (!isProductionHost) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // SW registration is best-effort. If it fails the app still works,
        // just without offline / install benefits.
      });
  });
}
