import type { NextApiRequest, NextApiResponse } from "next";
import { fetchZoUser, normalizePhone, serverError, supabase } from "../../../lib/cafe-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = await fetchZoUser(req);
  if ("error" in auth) return res.status(auth.status).json({ error: auth.error });

  const phone = normalizePhone(auth.user.mobile_number);
  if (phone.length !== 10) return res.status(502).json({ error: "zo user mobile_number unusable" });

  const { data, error } = await supabase
    .from("food_credit_wallets")
    .select("balance")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return serverError(res, error, "wallet");

  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({
    phone,
    balance: data?.balance ?? 0,
    has_wallet: !!data,
  });
}
