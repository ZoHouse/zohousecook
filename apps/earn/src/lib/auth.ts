import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "zo_user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const ADJECTIVES = ["Swift", "Bold", "Neon", "Cosmic", "Lunar", "Pixel", "Quantum", "Solar"];
const NOUNS = ["Builder", "Hunter", "Forge", "Voyager", "Rogue", "Sage", "Nomad", "Spark"];

function generateHandle(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900 + 100);
  return `${a}${n}_${num}`;
}

function setCookie(res: NextApiResponse, value: string) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export type EarnIdentity = {
  user: { id: string };
  profile: {
    handle: string;
    title: string;
    level: number;
    xp: number;
    xpMax: number;
    streak: number;
    questsDone: number;
    combo: number;
  };
};

/**
 * Resolve the current user. Reads `zo_user` cookie; if missing/unknown,
 * inserts a new row into `public.users` (id only — every other column is
 * nullable or has a default), then creates a matching row in
 * `earn_profiles`. The `users` schema is owned by the broader Zo platform
 * and is never altered from earn.
 */
export async function getOrCreateUser(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<EarnIdentity> {
  const existingId = req.cookies[COOKIE_NAME];

  if (existingId) {
    const profile = await prisma.earnProfile.findUnique({
      where: { userId: existingId },
    });
    if (profile) {
      return {
        user: { id: existingId },
        profile: {
          handle: profile.handle,
          title: profile.title,
          level: profile.level,
          xp: profile.xp,
          xpMax: profile.xpMax,
          streak: profile.streak,
          questsDone: profile.questsDone,
          combo: profile.combo,
        },
      };
    }
    // Cookie present but row missing — fall through and create fresh.
  }

  const id = randomUUID();
  // Insert a minimal row into public.users (id only). All other columns are
  // nullable or have defaults, so this is safe and non-destructive.
  await prisma.user.create({ data: { id } });

  // Generate a handle that doesn't collide. Retry a few times if unlucky.
  let profile = null;
  for (let attempt = 0; attempt < 5 && !profile; attempt++) {
    const handle = generateHandle();
    try {
      profile = await prisma.earnProfile.create({
        data: { userId: id, handle },
      });
    } catch {
      // Likely handle collision; retry.
    }
  }
  if (!profile) {
    throw new Error("could not allocate earn handle after retries");
  }

  setCookie(res, id);
  return {
    user: { id },
    profile: {
      handle: profile.handle,
      title: profile.title,
      level: profile.level,
      xp: profile.xp,
      xpMax: profile.xpMax,
      streak: profile.streak,
      questsDone: profile.questsDone,
      combo: profile.combo,
    },
  };
}

/** Read-only lookup. Returns null if no cookie or no profile yet. */
export async function getUser(req: NextApiRequest): Promise<EarnIdentity | null> {
  const id = req.cookies[COOKIE_NAME];
  if (!id) return null;
  const profile = await prisma.earnProfile.findUnique({
    where: { userId: id },
  });
  if (!profile) return null;
  return {
    user: { id },
    profile: {
      handle: profile.handle,
      title: profile.title,
      level: profile.level,
      xp: profile.xp,
      xpMax: profile.xpMax,
      streak: profile.streak,
      questsDone: profile.questsDone,
      combo: profile.combo,
    },
  };
}
