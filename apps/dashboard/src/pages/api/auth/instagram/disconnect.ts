import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../config/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Use POST (not DELETE) — DELETE with query params can be triggered via
  // img tags or simple URL visits. POST requires a form/fetch body.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const zoUserCode = ((req.body?.zo_user_code as string) || "").trim();
  if (!zoUserCode) {
    return res.status(400).json({ error: "zo_user_code is required" });
  }

  const { error } = await supabase
    .from("ig_connected_accounts")
    .delete()
    .eq("zo_user_code", zoUserCode);

  if (error) {
    console.error("[ig/disconnect] Error:", error.message);
    return res.status(500).json({ error: "Failed to disconnect" });
  }

  return res.status(200).json({ success: true });
}
