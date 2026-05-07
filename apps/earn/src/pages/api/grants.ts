import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";

const DEMO_GRANTS = [
  { id: "demo-1", title: "Builder Grant",   amount: "Up to $5,000",  description: "For developers building tools, dApps, and infrastructure for the Zo ecosystem.",          color: "#66DF48", active: true },
  { id: "demo-2", title: "Creator Grant",   amount: "Up to $2,500",  description: "For content creators, designers, and artists contributing to the Zo brand.",            color: "#9803CE", active: true },
  { id: "demo-3", title: "Community Grant", amount: "Up to $1,500",  description: "For community organizers running events, meetups, and educational workshops.",          color: "#FFD600", active: true },
  { id: "demo-4", title: "Research Grant",  amount: "Up to $10,000", description: "For researchers exploring decentralized governance, tokenomics, and social coordination.", color: "#FF4545", active: true },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const grants = await prisma.grant.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
      if (grants.length > 0) return res.status(200).json(grants);
    } catch (err) {
      console.error("[earn] grants fetch failed:", err);
    }
    return res.status(200).json(DEMO_GRANTS);
  }

  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;

    try {
      const { user } = await getOrCreateUser(req, res);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const title = String(body.title ?? "").trim();
      const amount = String(body.amount ?? "").trim();
      if (!title || !amount) {
        return res.status(400).json({ error: "title and amount are required" });
      }

      const created = await prisma.grant.create({
        data: {
          title,
          amount,
          description: body.description ? String(body.description) : null,
          color:       body.color ? String(body.color) : "#66DF48",
          active:      true,
        },
      });

      await prisma.analyticsEvent.create({
        data: { name: "grant_created", userId: user.id, properties: { grantId: created.id } },
      });

      return res.status(201).json(created);
    } catch (err) {
      console.error("[earn] grant create failed:", err);
      return res.status(500).json({ error: "create failed" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
