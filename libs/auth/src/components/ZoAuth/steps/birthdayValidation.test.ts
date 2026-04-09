import { validateBirthday } from "./birthdayValidation";

describe("validateBirthday", () => {
  // Use a fixed "today" for stable tests
  const today = new Date("2026-04-09");

  it("rejects empty input", () => {
    expect(validateBirthday("", today)).toEqual({
      ok: false,
      reason: "Pick a date",
    });
  });

  it("rejects malformed date strings", () => {
    expect(validateBirthday("not-a-date", today).ok).toBe(false);
  });

  it("rejects future dates", () => {
    expect(validateBirthday("2099-01-01", today)).toEqual({
      ok: false,
      reason: "Pick a date in the past",
    });
  });

  it("rejects users under 13", () => {
    expect(validateBirthday("2020-01-01", today)).toEqual({
      ok: false,
      reason: "Sorry, Zo World is 13+",
    });
  });

  it("accepts users exactly 13", () => {
    expect(validateBirthday("2013-04-09", today)).toEqual({ ok: true });
  });

  it("accepts users in their twenties", () => {
    expect(validateBirthday("2000-01-01", today)).toEqual({ ok: true });
  });

  it("warns on suspicious ages over 120 but allows", () => {
    expect(validateBirthday("1900-01-01", today)).toEqual({
      ok: true,
      warning: "Hmm, double-check that",
    });
  });

  it("rejects Feb 30 as invalid", () => {
    expect(validateBirthday("2000-02-30", today).ok).toBe(false);
  });
});
