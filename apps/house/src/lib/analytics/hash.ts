async function sha256Hex(input: string): Promise<string> {
  // Use Node.js crypto for Node.js, globalThis.crypto for browsers
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // Node.js environment
    const { createHash } = await import("crypto");
    return createHash("sha256").update(input).digest("hex");
  }
}

export async function hashE164Phone(phone: string): Promise<string> {
  const stripped = phone.replace(/\s+/g, "");
  if (!/^\+\d{8,15}$/.test(stripped)) {
    throw new Error(`hashE164Phone: input is not E.164: ${phone}`);
  }
  return sha256Hex(stripped);
}

export async function hashEmail(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase();
  if (!normalised.includes("@")) {
    throw new Error(`hashEmail: input is not an email: ${email}`);
  }
  return sha256Hex(normalised);
}
