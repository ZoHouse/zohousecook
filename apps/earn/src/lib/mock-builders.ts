import type {
  LeaderboardRow,
  SelfProfile,
  PublicProfile,
  BuilderShip,
} from "./builder-types";

const HANDLES = [
  "rohan", "aanya", "kabir", "meera", "advait", "ishaan", "neha", "vikram",
  "priya", "arjun", "tara", "dev", "saanvi", "rishi", "kiara", "yash",
  "anika", "ved", "naina", "aryan", "pia", "shaurya", "mira", "ayaan",
  "zara",
];

const TITLES = [
  "Zo Newbie",
  "Zo Hacker",
  "Zo Shipper",
  "Zo Maker",
  "Zo Architect",
  "Zo Legend",
];

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getMockLeaderboard(): LeaderboardRow[] {
  const rng = seedRandom(42);
  const rows: LeaderboardRow[] = HANDLES.map((handle, i) => {
    const ship = Math.floor(rng() * 800) + 200;
    const reach = Math.floor(rng() * 600) + 100;
    const consistency = Math.floor(rng() * 100);
    const total = ship + reach + consistency;
    return {
      userId: `mock-${i}`,
      handle,
      title: TITLES[Math.min(TITLES.length - 1, Math.floor(total / 250))],
      level: Math.min(50, Math.floor(total / 30)),
      scores7d: { ship, reach, consistency },
      lifetimeXp: total * 8 + Math.floor(rng() * 5000),
      streakDays: Math.floor(rng() * 30),
      lastShipAt: new Date(Date.now() - Math.floor(rng() * 7 * 24 * 3600 * 1000)).toISOString(),
      rank: 0,
    };
  });

  rows.sort((a, b) => b.scores7d.ship - a.scores7d.ship);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

function mockShips(userId: string, n: number): BuilderShip[] {
  const rng = seedRandom(userId.charCodeAt(0) + userId.length);
  const kinds: BuilderShip["kind"][] = [
    "pr_merged", "release", "commit", "x_post", "product_launch", "star_earned",
  ];
  const repos = [
    "zoworld/zo-app", "zoworld/passport", "zoworld/earn",
    "rohan/sidequest", "aanya/voxel-cafe", "kabir/farcaster-bot",
  ];
  return Array.from({ length: n }, (_, i) => {
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const repo = repos[Math.floor(rng() * repos.length)];
    return {
      id: `ship-${userId}-${i}`,
      userId,
      source: kind === "x_post" ? "x" : "github",
      kind,
      ref: kind === "x_post" ? "https://x.com/builder/status/123" : `https://github.com/${repo}/pull/${100 + i}`,
      repo: kind === "x_post" ? null : repo,
      title:
        kind === "pr_merged" ? `Merged PR: refactor auth flow on ${repo}`
        : kind === "release" ? `v1.${i}.0 released on ${repo}`
        : kind === "commit" ? `Commit on ${repo}`
        : kind === "x_post" ? `Posted: shipped a new feature today 🚀`
        : kind === "product_launch" ? `Launched new product`
        : `Earned a star on ${repo}`,
      isPrivate: false,
      occurredAt: new Date(Date.now() - i * 8 * 3600 * 1000).toISOString(),
    };
  });
}

export function getMockSelfProfile(handle: string): SelfProfile {
  const rng = seedRandom(handle.length * 7);
  const ship = Math.floor(rng() * 500) + 200;
  const reach = Math.floor(rng() * 400) + 100;
  const consistency = Math.floor(rng() * 90) + 10;
  return {
    userId: `self-${handle}`,
    handle,
    title: "Zo Shipper",
    level: 14,
    scores7d: { ship, reach, consistency },
    lifetimeXp: 12480,
    streakDays: 9,
    lastShipAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    accounts: [],
    recentShips: mockShips(`self-${handle}`, 8),
    products: [
      {
        id: "p1", repoFullName: "rohan/sidequest", name: "Sidequest",
        homepageUrl: "https://sidequest.app", isPublic: true,
        detectedAt: new Date().toISOString(), language: "TypeScript", stars: 142,
      },
      {
        id: "p2", repoFullName: "rohan/voxel-cafe", name: "Voxel Cafe",
        homepageUrl: "https://voxel.cafe", isPublic: false,
        detectedAt: new Date().toISOString(), language: "Rust", stars: 23,
      },
    ],
    hint: "Ship 1 more PR this week to pass @meera",
  };
}

export function getMockPublicProfile(handle: string): PublicProfile {
  const self = getMockSelfProfile(handle);
  return {
    ...self,
    accounts: [{ provider: "github", handle }],
    publicProducts: self.products.filter((p) => p.isPublic),
    heatmap: Array.from({ length: 84 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 6),
    })),
  };
}
