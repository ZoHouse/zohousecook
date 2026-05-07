// Types matching the future Prisma schema for the Builder Reputation feature.
// See docs/superpowers/specs/2026-05-06-earn-builder-reputation.md.

export type ShipSource = "github" | "x" | "zo-bounty";

export type ShipKind =
  | "pr_merged"
  | "release"
  | "commit"
  | "product_launch"
  | "x_post"
  | "star_earned"
  | "npm_publish"
  | "repo_created";

export type BuilderShip = {
  id: string;
  userId: string;
  source: ShipSource;
  kind: ShipKind;
  ref: string | null;
  repo: string | null;
  title: string;
  isPrivate: boolean;
  occurredAt: string;
};

export type BuilderProduct = {
  id: string;
  repoFullName: string;
  name: string;
  homepageUrl: string;
  isPublic: boolean;
  detectedAt: string;
  language: string | null;
  stars: number;
};

export type BuilderAccount = {
  provider: "github" | "x";
  handle: string;
  connectedAt: string;
};

export type AxisScores = {
  ship: number;
  reach: number;
  consistency: number;
};

export type BuilderStats = {
  userId: string;
  handle: string;
  title: string;
  level: number;
  scores7d: AxisScores;
  lifetimeXp: number;
  streakDays: number;
  lastShipAt: string | null;
};

export type LeaderboardRow = BuilderStats & {
  rank: number;
};

export type SelfProfile = BuilderStats & {
  accounts: BuilderAccount[];
  recentShips: BuilderShip[];
  products: BuilderProduct[];
  hint: string | null;
};

export type PublicProfile = BuilderStats & {
  accounts: Array<{ provider: "github" | "x"; handle: string }>;
  recentShips: BuilderShip[];
  publicProducts: BuilderProduct[];
  heatmap: Array<{ date: string; count: number }>;
};
