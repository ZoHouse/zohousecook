import {
  buildAttributionNoteLines,
  buildLeadNotes,
  deriveReferralSource,
  normalizeLandingPath,
  sanitizeFirstTouch,
} from "../../../lib/analytics/apply-attribution";

describe("apply attribution helpers", () => {
  it("keeps the explicit heardFrom value as referral_source", () => {
    expect(deriveReferralSource("Boldrin")).toBe("Boldrin");
  });

  it("normalizes the landing page path into a dedicated field", () => {
    expect(normalizeLandingPath("/vs-network-school")).toBe(
      "/vs-network-school"
    );
    expect(normalizeLandingPath("/apply")).toBeNull();
    expect(normalizeLandingPath("/")).toBeNull();
  });

  it("keeps only supported first-touch fields", () => {
    expect(
      sanitizeFirstTouch({
        utm_source: "x",
        utm_medium: "social",
        captured_at: "2026-04-27T12:00:00.000Z",
      })
    ).toEqual({
      utm_source: "x",
      utm_medium: "social",
      captured_at: "2026-04-27T12:00:00.000Z",
    });

    expect(
      sanitizeFirstTouch({
        captured_at: "2026-04-27T12:00:00.000Z",
      })
    ).toBeNull();
  });

  it("renders a structured attribution block for notes", () => {
    expect(
      buildAttributionNoteLines({
        pagePath: "/vs-network-school",
        referrer: "https://x.com/ZoHouse/status/1",
        firstTouch: {
          utm_source: "x",
          utm_medium: "social",
          utm_campaign: "founder-proof",
          fbc: "fb.1.123.AbCd",
          captured_at: "2026-04-27T12:00:00.000Z",
        },
      })
    ).toEqual([
      "Attribution:",
      "Landing path: /vs-network-school",
      "Referrer URL: https://x.com/ZoHouse/status/1",
      "UTM source: x",
      "UTM medium: social",
      "UTM campaign: founder-proof",
      "Meta click ID: fb.1.123.AbCd",
      "First touch captured at: 2026-04-27T12:00:00.000Z",
    ]);
  });

  it("appends attribution below the existing notes body", () => {
    expect(
      buildLeadNotes(["City: Bangalore", "Role: Founder"], {
        pagePath: "/vs-network-school",
        referrer: null,
        firstTouch: {
          utm_source: "x",
          captured_at: "2026-04-27T12:00:00.000Z",
        },
      })
    ).toBe(
      [
        "City: Bangalore",
        "Role: Founder",
        "",
        "Attribution:",
        "Landing path: /vs-network-school",
        "UTM source: x",
        "First touch captured at: 2026-04-27T12:00:00.000Z",
      ].join("\n")
    );
  });
});
