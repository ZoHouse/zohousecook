import type { NextApiRequest, NextApiResponse } from "next";
import { serverError, supabase } from "../../../lib/cafe-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { data, error } = await supabase
    .from("cafe_properties")
    .select("id,name,code,accepting_orders")
    .order("name");

  if (error) return serverError(res, error, "nodes");

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).json({ nodes: data });
}
