import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { propertyId } = req.query;
  if (typeof propertyId !== "string" || !UUID_RE.test(propertyId)) {
    return res.status(400).json({ error: "invalid propertyId" });
  }

  const { data, error } = await supabase
    .from("cafe_tables")
    .select("id,code,label,area,capacity,is_active")
    .eq("property_id", propertyId)
    .eq("is_active", true)
    .order("area")
    .order("code");

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).json({ tables: data });
}
