import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const { user } = await getOrCreateUser(req, res);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const name = String(body.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "name required" });

    await prisma.analyticsEvent.create({
      data: {
        name,
        userId: user.id,
        bountyId:   body.bountyId ? String(body.bountyId) : null,
        source:     body.source   ? String(body.source)   : null,
        properties: (body.properties as object | undefined) ?? undefined,
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[earn] /track failed:", err);
    return res.status(200).json({ ok: false });
  }
}
