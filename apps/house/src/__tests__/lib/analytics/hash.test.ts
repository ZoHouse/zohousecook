import { hashE164Phone, hashEmail } from "../../../lib/analytics/hash";

describe("hashE164Phone", () => {
  it("hashes a phone number deterministically", async () => {
    const a = await hashE164Phone("+919876543210");
    const b = await hashE164Phone("+919876543210");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("normalises whitespace before hashing", async () => {
    const a = await hashE164Phone(" +91 98765 43210 ");
    const b = await hashE164Phone("+919876543210");
    expect(a).toBe(b);
  });

  it("throws on non-E.164 input", async () => {
    await expect(hashE164Phone("9876543210")).rejects.toThrow();
  });
});

describe("hashEmail", () => {
  it("lowercases and trims before hashing", async () => {
    const a = await hashEmail(" Foo@BAR.com ");
    const b = await hashEmail("foo@bar.com");
    expect(a).toBe(b);
  });

  it("throws on missing @", async () => {
    await expect(hashEmail("notanemail")).rejects.toThrow();
  });
});
