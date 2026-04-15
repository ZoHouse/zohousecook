import {
  getOrCreateAnonymousId,
  getCurrentIdentity,
  setIdentity,
  resetIdentity,
  detectPhoneSwitch,
  ANON_KEY,
} from "../../../lib/analytics/identity";

describe("identity model", () => {
  beforeEach(() => localStorage.clear());

  it("creates a UUID anonymous id on first call and persists it", () => {
    const a = getOrCreateAnonymousId();
    const b = getOrCreateAnonymousId();
    expect(a).toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(localStorage.getItem(ANON_KEY)).toBe(a);
  });

  it("setIdentity stores phone_hash + raw phone + traits", () => {
    setIdentity({
      phone_hash: "abc123",
      phone_e164: "+919876543210",
      email: "x@y.com",
      full_name: "Test",
    });
    expect(getCurrentIdentity()?.phone_hash).toBe("abc123");
    expect(getCurrentIdentity()?.phone_e164).toBe("+919876543210");
  });

  it("resetIdentity clears identity AND anonymous id (per §7.2 phone-switch)", () => {
    const anon = getOrCreateAnonymousId();
    setIdentity({ phone_hash: "abc", phone_e164: "+919876543210" });
    resetIdentity();
    expect(getCurrentIdentity()).toBeNull();
    const newAnon = getOrCreateAnonymousId();
    expect(newAnon).not.toBe(anon);
  });

  it("detectPhoneSwitch returns true if a different phone_hash is set", () => {
    setIdentity({ phone_hash: "first", phone_e164: "+919000000001" });
    expect(detectPhoneSwitch("first")).toBe(false);
    expect(detectPhoneSwitch("different")).toBe(true);
  });

  it("detectPhoneSwitch returns false when no identity yet", () => {
    expect(detectPhoneSwitch("anything")).toBe(false);
  });
});
