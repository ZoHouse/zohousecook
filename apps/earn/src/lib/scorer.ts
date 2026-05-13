import { prisma } from "./prisma";

// 7-day rolling window. All three axes are normalized to roughly 0-100
// so the leaderboard sort is interpretable. The actual numbers are not
// dollar-precise — this is a motivation tool, not an accounting ledger.
export const WINDOW_DAYS = 7;

const KIND_WEIGHTS: Record<string, number> = {
  pr_merged: 5,
  release: 8,
  repo_created: 3,
  commit: 1,
  npm_publish: 6,
  product_launch: 10,
  x_post: 1,
  star_earned: 0, // rolls into reach, not ship
};

const TITLE_TIERS: Array<[number, string]> = [
  [0, "Zo Newbie"],
  [50, "Zo Tinkerer"],
  [200, "Zo Builder"],
  [500, "Zo Shipper"],
  [1500, "Zo Legend"],
];

function titleFor(lifetimeXp: number): string {
  let title = "Zo Newbie";
  for (const [threshold, label] of TITLE_TIERS) {
    if (lifetimeXp >= threshold) title = label;
  }
  return title;
}

export type ShipForScoring = {
  kind: string;
  occurredAt: Date;
  metadata: unknown;
};

export type Scores = {
  ship: number;
  reach: number;
  consistency: number;
};

export function computeScores(
  ships: ShipForScoring[],
  productStars: number,
  now: Date = new Date(),
): Scores {
  const cutoff = now.getTime() - WINDOW_DAYS * 24 * 3600 * 1000;
  const recent = ships.filter((s) => s.occurredAt.getTime() >= cutoff);

  // Ship: weighted sum of ship-kind events, capped at 100.
  let shipRaw = 0;
  for (const s of recent) {
    shipRaw += KIND_WEIGHTS[s.kind] ?? 0;
  }
  const ship = Math.min(100, shipRaw);

  // Reach: log-scaled stars on public products + post engagement when X lands.
  // log10(stars+1)*25 maps 0→0, 9→25, 99→50, 999→75, 9999→100.
  const reach = Math.min(100, Math.round(Math.log10(productStars + 1) * 25));

  // Consistency: distinct active days in window × (100/7), so 7/7 = 100.
  const dayKeys = new Set<string>();
  for (const s of recent) {
    const d = s.occurredAt;
    dayKeys.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`);
  }
  const consistency = Math.min(100, Math.round((dayKeys.size * 100) / WINDOW_DAYS));

  return { ship, reach, consistency };
}

// Streak: consecutive days ending today with at least one ship.
export function computeStreak(ships: ShipForScoring[], now: Date = new Date()): number {
  if (ships.length === 0) return 0;
  const dayKey = (d: Date) =>
    `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  const days = new Set(ships.map((s) => dayKey(s.occurredAt)));
  let streak = 0;
  const cursor = new Date(now);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function recomputeStatsFor(userId: string): Promise<void> {
  const [ships, products, existing] = await Promise.all([
    prisma.builderShip.findMany({
      where: { userId },
      select: { kind: true, occurredAt: true, metadata: true },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.builderProduct.findMany({
      where: { userId, isPublic: true },
      select: { stars: true },
    }),
    prisma.builderStats.findUnique({ where: { userId } }),
  ]);

  const productStars = products.reduce((sum, p) => sum + p.stars, 0);
  const scores = computeScores(ships, productStars);
  const streakDays = computeStreak(ships);
  const lastShipAt = ships[0]?.occurredAt ?? null;

  // Lifetime XP is monotonic — sum of weighted ships across all time.
  const lifetimeXp = ships.reduce(
    (sum, s) => sum + (KIND_WEIGHTS[s.kind] ?? 0),
    0,
  );
  const lifetimeTitle = titleFor(
    Math.max(lifetimeXp, existing?.lifetimeXp ?? 0),
  );

  await prisma.builderStats.upsert({
    where: { userId },
    create: {
      userId,
      shipScore: scores.ship,
      reachScore: scores.reach,
      consistencyScore: scores.consistency,
      lifetimeXp,
      lifetimeTitle,
      streakDays,
      lastShipAt,
    },
    update: {
      shipScore: scores.ship,
      reachScore: scores.reach,
      consistencyScore: scores.consistency,
      lifetimeXp: Math.max(lifetimeXp, existing?.lifetimeXp ?? 0),
      lifetimeTitle,
      streakDays,
      lastShipAt,
      computedAt: new Date(),
    },
  });
}
