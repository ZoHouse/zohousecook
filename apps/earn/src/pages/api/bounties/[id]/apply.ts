import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

function xpFor(rewardAmount: number) {
  return Math.max(50, Math.round(rewardAmount * 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ error: "missing id" });

  try {
    const user = await getOrCreateUser(req, res);
    const bounty = await prisma.bounty.findUnique({ where: { id } });
    if (!bounty) {
      return res.status(404).json({ error: "bounty not found" });
    }

    const xp = xpFor(bounty.rewardAmount);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.application.findUnique({
        where: { userId_bountyId: { userId: user.id, bountyId: bounty.id } },
      });

      if (existing) {
        return { application: existing, xpAwarded: 0, alreadyApplied: true };
      }

      const application = await tx.application.create({
        data: { userId: user.id, bountyId: bounty.id, status: "applied" },
      });
      await tx.bounty.update({
        where: { id: bounty.id },
        data: { applicants: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { xp: { increment: xp } },
      });
      await tx.analyticsEvent.create({
        data: {
          name: "bounty_apply",
          userId: user.id,
          bountyId: bounty.id,
          source: bounty.source,
          properties: { reward: bounty.reward, xp },
        },
      });

      return { application, xpAwarded: xp, alreadyApplied: false };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error("[earn] /apply failed:", err);
    return res.status(500).json({ error: "apply failed" });
  }
}
