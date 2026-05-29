import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

export const ZO_API = process.env.API_BASE_URL || "https://api.io.zo.xyz";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ZoUser = { id?: string; mobile_number?: string };

export function normalizePhone(s: string | undefined | null): string {
  return (s ?? "").replace(/\D/g, "").slice(-10);
}

export function serverError(res: NextApiResponse, err: unknown, where: string) {
  // Don't echo raw Supabase/Postgres error text to clients — it leaks schema.
  // Surface a stable opaque message; log details for Vercel/Sentry to pick up.
  // eslint-disable-next-line no-console
  console.error(`[cafe-api:${where}]`, err);
  return res.status(500).json({ error: "internal_error" });
}

export async function fetchZoUser(
  req: NextApiRequest,
  opts: { requireId?: boolean } = {},
): Promise<{ user: ZoUser } | { status: number; error: string }> {
  const auth = req.headers.authorization;
  if (!auth) return { status: 401, error: "missing Authorization" };

  const headers: Record<string, string> = { Authorization: auth };
  const deviceId = req.headers["client-device-id"];
  const deviceSecret = req.headers["client-device-secret"];
  const clientKey = req.headers["client-key"];
  if (typeof deviceId === "string") headers["client-device-id"] = deviceId;
  if (typeof deviceSecret === "string") headers["client-device-secret"] = deviceSecret;
  if (typeof clientKey === "string") headers["client-key"] = clientKey;

  const r = await fetch(`${ZO_API}/api/v1/auth/user/`, { headers });
  if (!r.ok) return { status: r.status >= 400 && r.status < 500 ? 401 : 502, error: "zo auth failed" };
  const user = (await r.json()) as ZoUser;
  if (!user?.mobile_number) return { status: 502, error: "zo user missing mobile_number" };
  if (opts.requireId && !user.id) return { status: 502, error: "zo user missing id" };
  return { user };
}
