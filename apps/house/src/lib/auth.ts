const API_BASE =
  process.env.API_BASE_URL || "https://api.io.zo.xyz";
const CLIENT_KEY =
  process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB ||
  process.env.APP_ID ||
  "1482d843137574f36f74";
const STORAGE_KEY = "zo-house";

export interface AuthUser {
  id: string;
  pid?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  mobile_number?: string;
  mobile_country_code?: string;
  email?: string;
  pfp_image?: string;
}

export interface StoredSession {
  user: AuthUser;
  token: string;
  valid_till: number; // ms epoch
  device_id: string;
  device_secret: string;
}

function randomString(length = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

function getOrCreateDeviceCreds(): { device_id: string; device_secret: string } {
  if (typeof window === "undefined") {
    return { device_id: "ssr", device_secret: "ssr" };
  }
  let device_id = localStorage.getItem(`${STORAGE_KEY}-device-id`);
  let device_secret = localStorage.getItem(`${STORAGE_KEY}-device-secret`);
  if (!device_id) {
    device_id = randomString(24);
    localStorage.setItem(`${STORAGE_KEY}-device-id`, device_id);
  }
  if (!device_secret) {
    device_secret = window.btoa(Date.now() + device_id);
    localStorage.setItem(`${STORAGE_KEY}-device-secret`, device_secret);
  }
  return { device_id, device_secret };
}

function commonHeaders(token?: string): Record<string, string> {
  const { device_id, device_secret } = getOrCreateDeviceCreds();
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "client-device-id": device_id,
    "client-device-secret": device_secret,
    "client-key": CLIENT_KEY,
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function requestMobileOtp(
  mobile: string,
  countryCode: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login/mobile/otp/`, {
      method: "POST",
      headers: commonHeaders(),
      body: JSON.stringify({
        mobile_number: mobile,
        mobile_country_code: countryCode,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status >= 200 && res.status < 300) return { ok: true };
    return { ok: false, error: data?.detail || data?.message || `status ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function verifyMobileOtp(
  mobile: string,
  countryCode: string,
  otp: string
): Promise<{ ok: boolean; session?: StoredSession; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login/mobile/`, {
      method: "POST",
      headers: commonHeaders(),
      body: JSON.stringify({
        mobile_number: mobile,
        mobile_country_code: countryCode,
        otp,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status >= 200 && res.status < 300 && data?.user && data?.token) {
      const { device_id, device_secret } = getOrCreateDeviceCreds();
      const validMs = Number(data.valid_till) || Date.now() + 7 * 24 * 3600 * 1000;
      const session: StoredSession = {
        user: data.user,
        token: data.token,
        valid_till: validMs < 1e12 ? validMs * 1000 : validMs, // accept seconds or ms
        device_id,
        device_secret,
      };
      persistSession(session);
      return { ok: true, session };
    }
    return {
      ok: false,
      error: data?.detail || data?.message || `status ${res.status}`,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function persistSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEY}-token`, session.token);
  localStorage.setItem(`${STORAGE_KEY}-user`, JSON.stringify(session.user));
  localStorage.setItem(`${STORAGE_KEY}-expiry`, String(session.valid_till));
}

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(`${STORAGE_KEY}-token`);
  const userJson = localStorage.getItem(`${STORAGE_KEY}-user`);
  const expiry = localStorage.getItem(`${STORAGE_KEY}-expiry`);
  if (!token || !userJson || !expiry) return null;
  const validTillMs = Number(expiry);
  if (!validTillMs || validTillMs < Date.now()) {
    clearSession();
    return null;
  }
  try {
    const user = JSON.parse(userJson) as AuthUser;
    const { device_id, device_secret } = getOrCreateDeviceCreds();
    return { user, token, valid_till: validTillMs, device_id, device_secret };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_KEY}-token`);
  localStorage.removeItem(`${STORAGE_KEY}-user`);
  localStorage.removeItem(`${STORAGE_KEY}-expiry`);
}
