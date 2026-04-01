import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../config/supabase";

const basePath = (process.env.NEXT_BASE_PATH || "").trim();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const dashboardUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "").trim()}${basePath}`;

  // Extract params
  let code = (req.query.code as string) || "";
  const state = (req.query.state as string) || "";
  const error = req.query.error as string | undefined;

  if (error || !code) {
    const reason = (req.query.error_description as string) || "oauth_denied";
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent(reason)}`
    );
  }

  // Strip trailing #_ that Instagram sometimes appends
  code = code.replace(/#.*$/, "");

  // --- Step 1: Validate CSRF state ---
  const { data: stateRow, error: stateFetchErr } = await supabase
    .from("ig_oauth_states")
    .select("zo_user_code, created_at")
    .eq("state", state)
    .single();

  if (stateFetchErr || !stateRow) {
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent("Invalid or expired OAuth state. Please try again.")}`
    );
  }

  // Check expiry (10 minutes)
  const stateAge = Date.now() - new Date(stateRow.created_at).getTime();
  if (stateAge > 10 * 60 * 1000) {
    await supabase.from("ig_oauth_states").delete().eq("state", state);
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent("OAuth session expired. Please try again.")}`
    );
  }

  const zoUserCode = stateRow.zo_user_code;

  // Delete used state (single-use)
  await supabase.from("ig_oauth_states").delete().eq("state", state);

  const appId = (process.env.INSTAGRAM_APP_ID || "").trim();
  const appSecret = (process.env.INSTAGRAM_APP_SECRET || "").trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const redirectUri = `${appUrl}${basePath}/api/auth/instagram/callback`;

  if (!appId || !appSecret) {
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent("Server misconfigured: missing Instagram credentials")}`
    );
  }

  try {
    // --- Step 2: Exchange code for short-lived token ---
    const tokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      let errMsg = `Token exchange failed (${tokenRes.status})`;
      try {
        const errBody = JSON.parse(tokenText);
        errMsg = errBody.error_message || errMsg;
      } catch {
        /* use default */
      }
      throw new Error(errMsg);
    }

    const tokenBody = JSON.parse(tokenText) as {
      access_token: string;
      user_id: number;
    };

    // --- Step 3: Exchange for long-lived token ---
    const longRes = await fetch(
      `https://graph.instagram.com/access_token` +
        `?grant_type=ig_exchange_token` +
        `&client_secret=${appSecret}` +
        `&access_token=${tokenBody.access_token}`
    );
    const longBody = (await longRes.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const accessToken = String(
      longBody.access_token || tokenBody.access_token
    );
    const expiresIn = longBody.expires_in as number | undefined;

    // --- Step 4: Fetch profile ---
    const profileRes = await fetch(
      `https://graph.instagram.com/v25.0/me` +
        `?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url` +
        `&access_token=${accessToken}`
    );

    if (!profileRes.ok) {
      const errBody = (await profileRes.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const errMsg =
        (errBody.error as Record<string, unknown>)?.message ||
        `Profile fetch failed (${profileRes.status})`;
      throw new Error(String(errMsg));
    }

    const profile = (await profileRes.json()) as {
      id: string;
      username: string;
      name?: string;
      biography?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
      profile_picture_url?: string;
    };

    // --- Step 5: Upsert to Supabase ---
    const now = new Date().toISOString();
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error: upsertErr } = await supabase
      .from("ig_connected_accounts")
      .upsert(
        {
          zo_user_code: zoUserCode,
          ig_user_id: profile.id,
          ig_username: profile.username,
          display_name: profile.name || profile.username,
          followers_count: profile.followers_count ?? 0,
          follows_count: profile.follows_count ?? 0,
          media_count: profile.media_count ?? 0,
          biography: profile.biography || null,
          profile_picture_url: profile.profile_picture_url || null,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          updated_at: now,
        },
        { onConflict: "zo_user_code" }
      );

    if (upsertErr) {
      console.error("[ig/callback] Upsert error:", upsertErr.message);
      throw new Error("Failed to save Instagram account");
    }

    return res.redirect(`${dashboardUrl}?ig_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ig/callback] Error:", message);
    return res.redirect(
      `${dashboardUrl}?ig_error=${encodeURIComponent(message)}`
    );
  }
}
