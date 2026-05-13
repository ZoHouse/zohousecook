import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import type {
  BuilderShip,
  BuilderProduct,
  PublicProfile,
} from "@/lib/builder-types";

// 84-day contribution heatmap = 12 weeks × 7 days. Used by /builders/[handle].
const HEATMAP_DAYS = 84;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const handle = (req.query.handle as string) || "";
  if (!handle) return res.status(400).json({ error: "missing handle" });

  const profile = await prisma.earnProfile.findUnique({
    where: { handle },
    select: {
      userId: true,
      handle: true,
      title: true,
      level: true,
      xp: true,
      streak: true,
    },
  });
  if (!profile) return res.status(404).json({ error: "not found" });

  const userId = profile.userId;
  const since = new Date(Date.now() - HEATMAP_DAYS * 24 * 3600 * 1000);

  const [stats, accounts, ships, products] = await Promise.all([
    prisma.builderStats.findUnique({ where: { userId } }),
    prisma.builderAccount.findMany({
      where: { userId },
      select: { provider: true, handle: true },
    }),
    prisma.builderShip.findMany({
      where: { userId, isPrivate: false, occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.builderProduct.findMany({
      where: { userId, isPublic: true },
      orderBy: { stars: "desc" },
    }),
  ]);

  // Heatmap: count of public ships per day across 84-day window.
  const counts = new Map<string, number>();
  for (const s of ships) {
    const k = dayKey(s.occurredAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const heatmap: Array<{ date: string; count: number }> = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const k = dayKey(d);
    heatmap.push({ date: k, count: counts.get(k) ?? 0 });
  }

  const recentShips: BuilderShip[] = ships.slice(0, 20).map((s) => ({
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

  const publicProducts: BuilderProduct[] = products.map((p) => ({
    id: p.id,
    repoFullName: p.repoFullName,
    name: p.name,
    homepageUrl: p.homepageUrl,
    isPublic: p.isPublic,
    detectedAt: p.detectedAt.toISOString(),
    language: p.language,
    stars: p.stars,
  }));

  const payload: PublicProfile = {
    userId,
    handle: profile.handle,
    title: stats?.lifetimeTitle ?? profile.title,
    level: profile.level,
    scores7d: {
      ship: stats?.shipScore ?? 0,
      reach: stats?.reachScore ?? 0,
      consistency: stats?.consistencyScore ?? 0,
    },
    lifetimeXp: stats?.lifetimeXp ?? profile.xp,
    streakDays: stats?.streakDays ?? profile.streak,
    lastShipAt: stats?.lastShipAt?.toISOString() ?? null,
    accounts: accounts.map((a) => ({
      provider: a.provider as "github" | "x",
      handle: a.handle,
    })),
    recentShips,
    publicProducts,
    heatmap,
  };

  return res.status(200).json(payload);
}
