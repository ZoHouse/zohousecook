import type { NextApiRequest, NextApiResponse } from "next";
import { serverError, supabase, UUID_RE } from "../../../../../lib/cafe-api";

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

  if (error) return serverError(res, error, "tables");

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).json({ tables: data });
}
