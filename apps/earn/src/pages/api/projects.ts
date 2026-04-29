import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";

const DEMO_PROJECTS = [
  { id: "demo-1", name: "ZoDAO Governance",   description: "Decentralized governance platform for community proposals and voting.",     color: "#66DF48", members: 34, status: "active", url: null },
  { id: "demo-2", name: "Zo Social Graph",     description: "On-chain social graph connecting creators, builders, and communities.",       color: "#FFD600", members: 21, status: "active", url: null },
  { id: "demo-3", name: "Zo Quest Engine",     description: "Gamified quest system for onboarding new members and rewarding engagement.", color: "#FF2F8E", members: 45, status: "active", url: null },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
      if (projects.length > 0) return res.status(200).json(projects);
    } catch (err) {
      console.error("[earn] projects fetch failed:", err);
    }
    return res.status(200).json(DEMO_PROJECTS);
  }

  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;

    try {
      const { user } = await getOrCreateUser(req, res);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const name = String(body.name ?? "").trim();
      if (!name) return res.status(400).json({ error: "name is required" });

      const created = await prisma.project.create({
        data: {
          name,
          description: body.description ? String(body.description) : null,
          color:       body.color ? String(body.color) : "#66DF48",
          members:     typeof body.members === "number" ? body.members : 1,
          status:      "active",
          url:         body.url ? String(body.url) : null,
        },
      });

      await prisma.analyticsEvent.create({
        data: { name: "project_created", userId: user.id, properties: { projectId: created.id } },
      });

      return res.status(201).json(created);
    } catch (err) {
      console.error("[earn] project create failed:", err);
      return res.status(500).json({ error: "create failed" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
