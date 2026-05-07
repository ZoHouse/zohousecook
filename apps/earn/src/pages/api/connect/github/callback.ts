import type { NextApiRequest, NextApiResponse } from "next";
import { getUser } from "@/lib/auth";
import { exchangeCodeForToken, fetchGitHubUser } from "@/lib/github-oauth";
import { ingestGitHubFor } from "@/lib/github-ingest";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const STATE_COOKIE = "oauth_state_github";

function clearStateCookie(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const { code, state, error: ghError } = req.query;
  if (ghError) {
    clearStateCookie(res);
    return res.redirect(302, `/profile?error=oauth_${String(ghError)}`);
  }
  if (typeof code !== "string" || typeof state !== "string") {
    clearStateCookie(res);
    return res.redirect(302, "/profile?error=oauth_invalid");
  }

  const cookieState = req.cookies[STATE_COOKIE];
  if (!cookieState || cookieState !== state) {
    clearStateCookie(res);
    return res.redirect(302, "/profile?error=oauth_state_mismatch");
  }

  const identity = await getUser(req);
  if (!identity) {
    clearStateCookie(res);
    return res.redirect(302, "/profile?error=not_signed_in");
  }

  try {
    const { accessToken, scope } = await exchangeCodeForToken(code);
    const ghUser = await fetchGitHubUser(accessToken);

    await prisma.builderAccount.upsert({
      where: {
        userId_provider: { userId: identity.user.id, provider: "github" },
      },
      create: {
        userId: identity.user.id,
        provider: "github",
        providerId: ghUser.id,
        handle: ghUser.login,
        accessToken: encrypt(accessToken),
        scope,
      },
      update: {
        providerId: ghUser.id,
        handle: ghUser.login,
        accessToken: encrypt(accessToken),
        scope,
      },
    });

    // Backfill last 30 days. If this fails the connection still succeeds —
    // user can refresh later. Don't block the redirect on ingest errors.
    try {
      const { shipsAdded, productsAdded } = await ingestGitHubFor(
        identity.user.id,
        accessToken,
        ghUser.login,
      );
      console.log(
        `[earn] github ingest for ${ghUser.login}: +${shipsAdded} ships, +${productsAdded} products`,
      );
    } catch (err) {
      console.error("[earn] github ingest failed (connection still OK):", err);
    }

    clearStateCookie(res);
    return res.redirect(302, "/profile?connected=github");
  } catch (err) {
    console.error("[earn] github callback failed:", err);
    clearStateCookie(res);
    return res.redirect(302, "/profile?error=oauth_failed");
  }
}
