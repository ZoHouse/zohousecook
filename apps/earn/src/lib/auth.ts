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
  res.setHeader("Set-Cookie", parts.join("; "));
}

/**
 * Resolve the current anonymous user. Reads `zo_user` cookie, creates a row on
 * first hit. This is the lightweight gamification identity — separate from the
 * Zo phone-OTP identity used for the admin gate.
 */
export async function getOrCreateUser(req: NextApiRequest, res: NextApiResponse) {
  const existingId = req.cookies[COOKIE_NAME];

  if (existingId) {
    const user = await prisma.user.findUnique({ where: { id: existingId } });
    if (user) return user;
  }

  const id = randomUUID();
  const user = await prisma.user.create({
    data: { id, handle: generateHandle() },
  });
  setCookie(res, id);
  return user;
}

/** Read-only: returns null if no cookie or row missing. Does not create. */
export async function getUser(req: NextApiRequest) {
  const id = req.cookies[COOKIE_NAME];
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
