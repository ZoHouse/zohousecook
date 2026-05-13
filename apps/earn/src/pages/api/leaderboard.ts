import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import type { LeaderboardRow } from "@/lib/builder-types";

type Sort = "ship" | "reach" | "consistency";

const ORDER_KEY: Record<Sort, "shipScore" | "reachScore" | "consistencyScore"> = {
  ship: "shipScore",
  reach: "reachScore",
  consistency: "consistencyScore",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const sortParam = (req.query.sort as string) || "ship";
  const sort: Sort = (["ship", "reach", "consistency"] as const).includes(
    sortParam as Sort,
  )
    ? (sortParam as Sort)
    : "ship";

  const stats = await prisma.builderStats.findMany({
    orderBy: { [ORDER_KEY[sort]]: "desc" },
    take: 100,
    include: {
      user: {
        include: {
          earnProfile: { select: { handle: true, title: true, level: true } },
        },
      },
    },
  });

  const rows: LeaderboardRow[] = stats.map((s, i) => ({
    userId: s.userId,
    handle: s.user.earnProfile?.handle ?? `builder-${s.userId.slice(0, 6)}`,
    title: s.lifetimeTitle ?? s.user.earnProfile?.title ?? "Zo Newbie",
    level: s.user.earnProfile?.level ?? 1,
    scores7d: {
      ship: s.shipScore,
      reach: s.reachScore,
      consistency: s.consistencyScore,
    },
    lifetimeXp: s.lifetimeXp,
    streakDays: s.streakDays,
    lastShipAt: s.lastShipAt?.toISOString() ?? null,
    rank: i + 1,
  }));

  return res.status(200).json({ rows, sort, windowDays: 7 });
}
