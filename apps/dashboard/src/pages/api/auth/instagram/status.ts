import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../config/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const zoUserCode = ((req.query.zo_user_code as string) || "").trim();
  if (!zoUserCode) {
    return res.status(400).json({ error: "zo_user_code is required" });
  }

  const { data, error } = await supabase
    .from("ig_connected_accounts")
    .select(
      "ig_username, display_name, followers_count, profile_picture_url, biography, connected_at"
    )
    .eq("zo_user_code", zoUserCode)
    .single();

  if (error || !data) {
    return res.status(200).json({ connected: false, account: null });
  }

  return res.status(200).json({ connected: true, account: data });
}
