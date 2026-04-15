export const ANON_KEY = "zo_house_aid";
export const IDENTITY_KEY = "zo_house_identity";

export interface Identity {
  phone_hash: string;
  phone_e164: string;
  email?: string;
  full_name?: string;
  zo_pid?: string;
}

function uuidv4(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older Safari / environments.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = localStorage.getItem(ANON_KEY);
  if (existing) return existing;
  const id = uuidv4();
  localStorage.setItem(ANON_KEY, id);
  return id;
}

export function getCurrentIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

export function setIdentity(identity: Identity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function resetIdentity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IDENTITY_KEY);
  // Per §7.2: returning user verifies a different phone → new anonymous id
  // (otherwise the prior session's events would attach to the new identity).
  localStorage.removeItem(ANON_KEY);
}

export function detectPhoneSwitch(newPhoneHash: string): boolean {
  const current = getCurrentIdentity();
  if (!current) return false;
  return current.phone_hash !== newPhoneHash;
}
