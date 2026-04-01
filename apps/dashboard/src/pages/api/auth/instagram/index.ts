import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
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

  const appId = (process.env.INSTAGRAM_APP_ID || "").trim();
  if (!appId) {
    return res.status(500).json({ error: "INSTAGRAM_APP_ID not configured" });
  }

  // Generate CSRF state token and store with user binding
  const state = randomUUID();
  const { error: stateErr } = await supabase
    .from("ig_oauth_states")
    .insert({ state, zo_user_code: zoUserCode });

  if (stateErr) {
    console.error("[ig/start] Failed to store state:", stateErr.message);
    return res.status(500).json({ error: "Failed to initiate OAuth" });
  }

  // Clean up expired states (older than 10 minutes)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase.from("ig_oauth_states").delete().lt("created_at", tenMinAgo);

  // Build the redirect URI
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const basePath = (process.env.NEXT_BASE_PATH || "").trim();
  const redirectUri = `${appUrl}${basePath}/api/auth/instagram/callback`;

  const authUrl =
    "https://www.instagram.com/oauth/authorize" +
    "?enable_fb_login=0" +
    `&client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    "&scope=instagram_business_basic" +
    `&state=${state}`;

  return res.redirect(authUrl);
}
