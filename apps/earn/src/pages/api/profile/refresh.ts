import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { ingestGitHubFor } from "@/lib/github-ingest";
import { recomputeStatsFor } from "@/lib/scorer";

// Re-runs ingest + scorer for the signed-in user. Used by the "Refresh"
// button on /profile. Idempotent — duplicate ships are deduped by ref.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const identity = await getUser(req);
  if (!identity) return res.status(401).json({ error: "not signed in" });
  const userId = identity.user.id;

  const github = await prisma.builderAccount.findUnique({
    where: { userId_provider: { userId, provider: "github" } },
  });
  if (!github) {
    return res.status(400).json({ error: "github not connected" });
  }

  try {
    const accessToken = decrypt(github.accessToken);
    const { shipsAdded, productsAdded } = await ingestGitHubFor(
      userId,
      accessToken,
      github.handle,
    );
    await recomputeStatsFor(userId);
    return res.status(200).json({ ok: true, shipsAdded, productsAdded });
  } catch (err) {
    console.error("[earn] manual refresh failed:", err);
    return res.status(500).json({ error: "refresh failed" });
  }
}
