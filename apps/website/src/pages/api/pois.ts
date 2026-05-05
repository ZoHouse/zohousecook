import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // RPC returns a single JSONB value containing the whole FeatureCollection.
  // Single-value return bypasses PostgREST's 1000-row cap entirely.
  const { data, error } = await supabase.rpc("get_pois_geojson");
  if (error) return res.status(500).json({ error: error.message });

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).json(data);
}
