import type { NextApiRequest, NextApiResponse } from "next";
import { fetchZoUser, normalizePhone, serverError, supabase, UUID_RE } from "../../../lib/cafe-api";

const HEX32_RE = /^[0-9a-f]{32}$/i;
// RPC accepts only 'cash' | 'razorpay'; 'zo_card' is set internally when food
// credits cover the order. Keep the API allowlist aligned with the RPC.
const PAYMENT_MODES = new Set(["cash", "razorpay"]);
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const CUSTOMER_NAME_MAX = 80;

type Item = { menu_item_id: string; quantity: number };

function badRequest(res: NextApiResponse, msg: string) {
  return res.status(400).json({ error: msg });
}

function normalizeId(s: string): string {
  return s.replace(/-/g, "").toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const b = req.body ?? {};
  const {
    property_id,
    table_id,
    customer_name,
    customer_phone,
    zo_user_id,
    items,
    food_credit_paise,
    payment_mode,
    notes,
  } = b;

  if (typeof property_id !== "string" || !UUID_RE.test(property_id)) return badRequest(res, "invalid property_id");
  if (typeof table_id !== "string" || !UUID_RE.test(table_id)) return badRequest(res, "invalid table_id");
  if (typeof customer_name !== "string" || !customer_name.trim() || customer_name.length > CUSTOMER_NAME_MAX) {
    return badRequest(res, "invalid customer_name");
  }
  if (typeof customer_phone !== "string" || !/^\d{10}$/.test(customer_phone)) return badRequest(res, "invalid customer_phone");
  if (typeof zo_user_id !== "string" || !(UUID_RE.test(zo_user_id) || HEX32_RE.test(zo_user_id))) {
    return badRequest(res, "invalid zo_user_id");
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) return badRequest(res, "items must be 1..20");
  for (const it of items as Item[]) {
    if (!it || typeof it.menu_item_id !== "string" || !UUID_RE.test(it.menu_item_id)) return badRequest(res, "invalid item.menu_item_id");
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 10) return badRequest(res, "invalid item.quantity (1..10)");
  }
  if (!Number.isInteger(food_credit_paise) || food_credit_paise < 0) return badRequest(res, "invalid food_credit_paise");
  if (typeof payment_mode !== "string" || !PAYMENT_MODES.has(payment_mode)) return badRequest(res, "invalid payment_mode");
  if (notes != null && (typeof notes !== "string" || notes.length > 300)) return badRequest(res, "invalid notes");

  const auth = await fetchZoUser(req, { requireId: true });
  if ("error" in auth) return res.status(auth.status).json({ error: auth.error });

  if (normalizePhone(auth.user.mobile_number) !== customer_phone) {
    return res.status(403).json({ error: "customer_phone does not match auth token" });
  }
  if (normalizeId(auth.user.id!) !== normalizeId(zo_user_id)) {
    return res.status(403).json({ error: "zo_user_id does not match auth token" });
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: rateErr } = await supabase
    .from("cafe_orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_phone", customer_phone)
    .gte("created_at", windowStart);

  if (rateErr) return serverError(res, rateErr, "orders.ratelimit");
  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    res.setHeader("Retry-After", "300");
    return res.status(429).json({
      error: "rate_limited",
      message: `too many orders in the last 5 minutes (max ${RATE_LIMIT_MAX}); take a breath`,
    });
  }

  const { data, error } = await supabase.rpc("place_cafe_order", {
    p_property_id: property_id,
    p_table_id: table_id,
    p_customer_name: customer_name.trim(),
    p_customer_phone: customer_phone,
    p_zo_user_id: zo_user_id,
    p_items: items,
    p_food_credit_paise: food_credit_paise,
    p_payment_mode: payment_mode,
    p_notes: notes ?? null,
  });

  if (error) {
    const msg = (error.message || "").replace(/^.*RAISE EXCEPTION:\s*/, "");
    return res.status(400).json({ error: msg || "order failed" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(data);
}
