import { captureFirstTouch, getFirstTouch } from "../../../lib/analytics/utm";

describe("captureFirstTouch / getFirstTouch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists UTM params from URL on first call", () => {
    captureFirstTouch(
      "https://zo.house/?utm_source=meta&utm_medium=paid_social&utm_campaign=vsns_drop"
    );
    expect(getFirstTouch()).toEqual(
      expect.objectContaining({
        utm_source: "meta",
        utm_medium: "paid_social",
        utm_campaign: "vsns_drop",
      })
    );
  });

  it("does not overwrite first touch on subsequent calls", () => {
    captureFirstTouch("https://zo.house/?utm_source=twitter");
    captureFirstTouch("https://zo.house/?utm_source=email");
    expect(getFirstTouch()?.utm_source).toBe("twitter");
  });

  it("ignores URLs with no UTM params", () => {
    captureFirstTouch("https://zo.house/");
    expect(getFirstTouch()).toBeNull();
  });

  it("captures fbclid into _fbc cookie format", () => {
    captureFirstTouch("https://zo.house/?fbclid=AbCdEf123");
    const fbc = getFirstTouch()?.fbc;
    expect(fbc).toMatch(/^fb\.1\.\d+\.AbCdEf123$/);
  });
});
