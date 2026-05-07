import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import type { BuilderShip, BuilderProduct } from "@/lib/builder-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const identity = await getUser(req);
  if (!identity) return res.status(401).json({ error: "not signed in" });
  const userId = identity.user.id;

  const [accounts, ships, products] = await Promise.all([
    prisma.builderAccount.findMany({
      where: { userId },
      select: { provider: true, handle: true, connectedAt: true },
    }),
    prisma.builderShip.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
    prisma.builderProduct.findMany({
      where: { userId },
      orderBy: { detectedAt: "desc" },
    }),
  ]);

  const recentShips: BuilderShip[] = ships.map((s) => ({
    id: s.id,
    userId: s.userId,
    source: s.source as BuilderShip["source"],
    kind: s.kind as BuilderShip["kind"],
    ref: s.ref,
    repo: s.repo,
    title: s.title ?? `${s.kind.replace(/_/g, " ")} on ${s.repo ?? "—"}`,
    isPrivate: s.isPrivate,
    occurredAt: s.occurredAt.toISOString(),
  }));

  const productList: BuilderProduct[] = products.map((p) => ({
    id: p.id,
    repoFullName: p.repoFullName,
    name: p.name,
    homepageUrl: p.homepageUrl,
    isPublic: p.isPublic,
    detectedAt: p.detectedAt.toISOString(),
    language: p.language,
    stars: p.stars,
  }));

  // Scores stay zeroed until PR #4 (the scorer) lands. The shape is here so
  // the UI doesn't break, but the values reflect "no score computed yet".
  return res.status(200).json({
    userId,
    handle: identity.profile.handle,
    title: identity.profile.title,
    level: identity.profile.level,
    scores7d: { ship: 0, reach: 0, consistency: 0 },
    lifetimeXp: identity.profile.xp,
    streakDays: identity.profile.streak,
    lastShipAt: recentShips[0]?.occurredAt ?? null,
    accounts: accounts.map((a) => ({
      provider: a.provider as "github" | "x",
      handle: a.handle,
      connectedAt: a.connectedAt.toISOString(),
    })),
    recentShips,
    products: productList,
    hint: accounts.length === 0
      ? "Connect GitHub to start scoring this week."
      : recentShips.length === 0
      ? "No ships in the last 30 days yet — push a commit or merge a PR."
      : null,
  });
}
