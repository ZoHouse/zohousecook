import {
  initConsent,
  updateConsent,
  hasConsent,
  ConsentCategory,
} from "../../../lib/analytics/consent";

describe("consent", () => {
  let gtagCalls: unknown[][];

  beforeEach(() => {
    gtagCalls = [];
    (window as any).gtag = (...args: unknown[]) => gtagCalls.push(args);
    // Reset module's in-memory state by re-requiring is not trivial; tests
    // that depend on default state run first. Each test that mutates calls
    // updateConsent explicitly.
  });

  it("initConsent emits default = granted (per §13.2 launch posture)", () => {
    initConsent();
    expect(gtagCalls[0]).toEqual([
      "consent",
      "default",
      {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        wait_for_update: 500,
      },
    ]);
  });

  it("updateConsent emits an update event", () => {
    initConsent();
    updateConsent({ analytics_storage: "denied" });
    expect(gtagCalls[1]).toEqual([
      "consent",
      "update",
      { analytics_storage: "denied" },
    ]);
  });

  it("hasConsent reflects the latest state", () => {
    updateConsent({ analytics_storage: "granted" });
    expect(hasConsent("analytics_storage" as ConsentCategory)).toBe(true);
    updateConsent({ analytics_storage: "denied" });
    expect(hasConsent("analytics_storage" as ConsentCategory)).toBe(false);
  });

  it("no-ops gracefully when gtag is not yet loaded", () => {
    delete (window as any).gtag;
    expect(() => initConsent()).not.toThrow();
    expect(() => updateConsent({ ad_storage: "denied" })).not.toThrow();
  });
});
