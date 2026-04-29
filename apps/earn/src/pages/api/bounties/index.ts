import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";

type DemoBounty = {
  id: string;
  title: string;
  description: string | null;
  reward: string;
  tags: string[];
  deadline: string | null;
  source: string;
  sourceId: string;
  url: string | null;
  applicants: number;
  status: string;
  color: string | null;
  imageUrl: string;
};

const img = (seed: string, bg: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=${bg.replace("#", "")}&radius=12`;

const DEMO_BOUNTIES: DemoBounty[] = [
  { id: "demo-1",  title: "Kazakhstan Solana Projects Spotlight — Content Bounty", description: "Write a deep-dive on one Kazakhstan-based Solana project. 1500+ words, original research.", reward: "USDC 950",   tags: ["Content","Research"],     deadline: "in 10d", source: "superteam", sourceId: "demo-1",  url: "https://earn.superteam.fun", applicants: 14, status: "open", color: "#14F195", imageUrl: img("superteam-kazakhstan", "#14F195") },
  { id: "demo-2",  title: "Birdeye Data 4-Week BIP Competition — Sprint 1",        description: "Build a data visualization using Birdeye's token APIs. Public demo required.",          reward: "USDC 500",   tags: ["Data","DeFi"],            deadline: "in 24d", source: "superteam", sourceId: "demo-2",  url: "https://earn.superteam.fun", applicants: 7,  status: "open", color: "#F0B90B", imageUrl: img("birdeye-data", "#F0B90B") },
  { id: "demo-3",  title: "Manic Agent Benchmark UGC Contest",                     description: "Record a 60-second clip showing Manic's trading agent in action. Top 3 win USDC.",       reward: "USDC 1,000", tags: ["UGC","AI Agents"],        deadline: "in 15d", source: "superteam", sourceId: "demo-3",  url: "https://earn.superteam.fun", applicants: 22, status: "open", color: "#F97316", imageUrl: img("manic-trade", "#F97316") },
  { id: "demo-4",  title: "Infinity AI Art Remix Contest #3",                      description: "Remix one Infinity Labs reference image using their open SDK. 10 winners.",              reward: "USDC 175",   tags: ["Design","AI"],            deadline: "in 4d",  source: "superteam", sourceId: "demo-4",  url: "https://earn.superteam.fun", applicants: 31, status: "open", color: "#8B5CF6", imageUrl: img("infinity-labs", "#8B5CF6") },
  { id: "demo-5",  title: "Layer3 Quest — Onboarding Flow Design",                 description: "Design 3 onboarding screens for a crypto-native wallet targeting first-time users.",     reward: "USDC 400",   tags: ["Design","UX"],            deadline: "in 8d",  source: "layer3",    sourceId: "demo-5",  url: "https://layer3.xyz",         applicants: 5,  status: "open", color: "#3B82F6", imageUrl: img("layer3-onboarding", "#3B82F6") },
  { id: "demo-6",  title: "Gitcoin Grants Round — Public Goods Proposal",          description: "Submit a funding proposal for an open-source dev tool. Must have a working prototype.", reward: "USDC 2,500", tags: ["Funding","Open Source"],  deadline: "in 6d",  source: "gitcoin",   sourceId: "demo-6",  url: "https://gitcoin.co",         applicants: 18, status: "open", color: "#06B6D4", imageUrl: img("gitcoin-grants", "#06B6D4") },
  { id: "demo-7",  title: "Dework — Build a Discord Bot for DAO Ops",              description: "Build a Discord bot that automates proposal voting and member onboarding.",              reward: "USDC 1,200", tags: ["Engineering","DAO"],      deadline: "in 12d", source: "dework",    sourceId: "demo-7",  url: "https://dework.xyz",         applicants: 9,  status: "open", color: "#10B981", imageUrl: img("dework-bot", "#10B981") },
  { id: "demo-8",  title: "Replit — Ship a Template in 48 Hours",                  description: "Ship a reusable Replit template for a new framework. Must include README + demo.",       reward: "USDC 300",   tags: ["Engineering","Template"], deadline: "in 2d",  source: "replit",    sourceId: "demo-8",  url: "https://replit.com",         applicants: 26, status: "open", color: "#F56565", imageUrl: img("replit-ship", "#F56565") },
  { id: "demo-9",  title: "GitHub — Triage 50 Issues on Kubernetes",               description: "Help the Kubernetes maintainers by triaging and tagging open issues.",                   reward: "USDC 150",   tags: ["Open Source","Devops"],   deadline: "in 30d", source: "github",    sourceId: "demo-9",  url: "https://github.com",         applicants: 4,  status: "open", color: "#6366F1", imageUrl: img("k8s-triage", "#6366F1") },
  { id: "demo-10", title: "Solana Mobile dApp Showcase",                           description: "Submit a working dApp for Solana Seeker. Top entries featured on Solana blog.",          reward: "USDC 5,000", tags: ["Engineering","Mobile"],   deadline: "in 18d", source: "superteam", sourceId: "demo-10", url: "https://earn.superteam.fun", applicants: 11, status: "open", color: "#14F195", imageUrl: img("solana-mobile", "#14F195") },
  { id: "demo-11", title: "Superteam India Meme Contest — April",                  description: "Best Solana-themed meme. Karma + USDC for top 5. One submission per person.",            reward: "USDC 100",   tags: ["Community","Content"],    deadline: "in 3d",  source: "superteam", sourceId: "demo-11", url: "https://earn.superteam.fun", applicants: 47, status: "open", color: "#EC4899", imageUrl: img("superteam-meme", "#EC4899") },
  { id: "demo-12", title: "Layer3 — Tutorial Video for ZK Rollups",                description: "Record a 10-min tutorial explaining ZK rollups for developers.",                          reward: "USDC 700",   tags: ["Content","Tutorial"],     deadline: "in 9d",  source: "layer3",    sourceId: "demo-12", url: "https://layer3.xyz",         applicants: 6,  status: "open", color: "#3B82F6", imageUrl: img("layer3-zk-tutorial", "#3B82F6") },
];

function parseAmount(reward: string): number {
  const n = Number((reward || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const source = typeof req.query.source === "string" ? req.query.source : null;
    const status = typeof req.query.status === "string" ? req.query.status : "open";
    const limit = parseInt(typeof req.query.limit === "string" ? req.query.limit : "50");

    const where: Record<string, string> = { status };
    if (source) where.source = source;

    try {
      const bounties = await prisma.bounty.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (bounties.length > 0) return res.status(200).json(bounties);
    } catch (err) {
      console.error("[earn] bounties fetch failed, falling back to demo:", err);
    }

    const filtered = source
      ? DEMO_BOUNTIES.filter((b) => b.source === source)
      : DEMO_BOUNTIES;
    return res.status(200).json(filtered.slice(0, limit));
  }

  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;

    try {
      const user = await getOrCreateUser(req, res);
      const body = (req.body ?? {}) as Record<string, unknown>;

      const title = String(body.title ?? "").trim();
      const reward = String(body.reward ?? "").trim();
      if (!title || !reward) {
        return res.status(400).json({ error: "title and reward are required" });
      }

      const created = await prisma.bounty.create({
        data: {
          title,
          description:  body.description ? String(body.description) : null,
          reward,
          rewardAmount: parseAmount(reward),
          tags:         Array.isArray(body.tags) ? (body.tags as string[]).slice(0, 6) : [],
          deadline:     body.deadline ? String(body.deadline) : null,
          source:       "zo",
          sourceId:     `zo-${Date.now()}-${user.id.slice(0, 8)}`,
          url:          body.url ? String(body.url) : null,
          imageUrl:     body.imageUrl ? String(body.imageUrl) : null,
          color:        body.color ? String(body.color) : "#66DF48",
        },
      });

      await prisma.analyticsEvent.create({
        data: { name: "bounty_posted", userId: user.id, bountyId: created.id, source: "zo" },
      });

      return res.status(201).json(created);
    } catch (err) {
      console.error("[earn] bounty create failed:", err);
      return res.status(500).json({ error: "create failed" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
