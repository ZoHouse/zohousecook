import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const DEMO_NODES = [
  { id: 1,  label: "Intro" },
  { id: 2,  label: "First Blood" },
  { id: 3,  label: "Solana" },
  { id: 4,  label: "React" },
  { id: 5,  label: "Layer3" },
  { id: 6,  label: "Content" },
  { id: 7,  label: "Design" },
  { id: 8,  label: "AI Agents" },
  { id: 9,  label: "Web3" },
  { id: 10, label: "Boss" },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  let nodes = DEMO_NODES;
  let questsDone = 4;

  try {
    const [identity, dbNodes] = await Promise.all([
      getOrCreateUser(req, res),
      prisma.seasonNode.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    if (dbNodes.length > 0) nodes = dbNodes.map((n) => ({ id: n.id, label: n.label }));
    questsDone = identity.profile.questsDone;
  } catch (err) {
    console.error("[earn] season-path falling back to demo:", err);
  }

  const path = nodes.map((node, idx) => ({
    id: node.id,
    label: node.label,
    status: idx < questsDone ? "done" : idx === questsDone ? "current" : "locked",
  }));

  return res.status(200).json({ path, questsDone, total: nodes.length });
}
