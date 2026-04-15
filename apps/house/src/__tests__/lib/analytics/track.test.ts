import { track, _setDestinationsForTest } from "../../../lib/analytics/track";

describe("track()", () => {
  const ga4 = jest.fn();
  const posthog = jest.fn();
  const moengage = jest.fn();
  const metaPixel = jest.fn();

  beforeEach(() => {
    ga4.mockClear();
    posthog.mockClear();
    moengage.mockClear();
    metaPixel.mockClear();
    _setDestinationsForTest({ ga4, posthog, moengage, metaPixel });
  });

  it("fans out a typed event to all four destinations", () => {
    track("village_slot_click", {
      island: "blr",
      slot_index: 3,
      occupied: true,
    });
    expect(ga4).toHaveBeenCalledWith("village_slot_click", {
      island: "blr",
      slot_index: 3,
      occupied: true,
    });
    expect(posthog).toHaveBeenCalledWith("village_slot_click", expect.any(Object));
    expect(moengage).toHaveBeenCalledWith("village_slot_click", expect.any(Object));
    expect(metaPixel).toHaveBeenCalled();
  });

  it("supports zero-prop events", () => {
    track("zo_radio_play");
    expect(ga4).toHaveBeenCalledWith("zo_radio_play", {});
  });

  it("isolates failures across destinations (one throwing does not break others)", () => {
    ga4.mockImplementation(() => {
      throw new Error("ga4 down");
    });
    expect(() =>
      track("scroll_milestone", { percent: 50, page_path: "/" })
    ).not.toThrow();
    expect(posthog).toHaveBeenCalled();
    expect(moengage).toHaveBeenCalled();
  });
});
