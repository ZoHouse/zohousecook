import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { getOrCreateUser } from "@/lib/auth";
import { buildAuthorizeUrl } from "@/lib/github-oauth";

const STATE_COOKIE = "oauth_state_github";
const STATE_MAX_AGE = 600; // 10 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  // Make sure the builder has a Zo identity before they leave for GitHub.
  await getOrCreateUser(req, res);

  const state = crypto.randomBytes(24).toString("hex");

  let url: string;
  try {
    url = buildAuthorizeUrl(state);
  } catch (err) {
    console.error("[earn] github oauth init failed:", err);
    return res.redirect(302, "/profile?error=oauth_not_configured");
  }

  // The Set-Cookie header may already include the zo_user cookie from
  // getOrCreateUser. Append the state cookie via a list to preserve both.
  const existing = res.getHeader("Set-Cookie");
  const stateCookie = `${STATE_COOKIE}=${state}; Path=/; Max-Age=${STATE_MAX_AGE}; HttpOnly; SameSite=Lax`;
  res.setHeader(
    "Set-Cookie",
    Array.isArray(existing)
      ? [...existing, stateCookie]
      : existing
        ? [String(existing), stateCookie]
        : [stateCookie],
  );

  return res.redirect(302, url);
}
