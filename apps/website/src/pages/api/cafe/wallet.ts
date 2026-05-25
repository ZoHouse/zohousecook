import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

const ZO_API = process.env.API_BASE_URL || "https://api.io.zo.xyz";

type ZoUser = { id?: string; mobile_number?: string };

async function fetchZoUser(req: NextApiRequest): Promise<{ user: ZoUser } | { status: number; error: string }> {
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
  return { user };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = await fetchZoUser(req);
  if ("error" in auth) return res.status(auth.status).json({ error: auth.error });

  const phone = auth.user.mobile_number!.slice(-10);

  const { data, error } = await supabase
    .from("food_credit_wallets")
    .select("balance")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({
    phone,
    balance: data?.balance ?? 0,
    has_wallet: !!data,
  });
}
