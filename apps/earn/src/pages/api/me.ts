import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const user = await getOrCreateUser(req, res);

    const [unlocked, allAchievements] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        select: { achievementId: true },
      }),
      prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    const unlockedSet = new Set(unlocked.map((u) => u.achievementId));
    const achievements = allAchievements.map((a) => ({
      id: a.id,
      label: a.label,
      desc: a.description,
      icon: a.icon,
      color: a.color,
      unlocked: unlockedSet.has(a.id),
    }));

    return res.status(200).json({
      handle:     user.handle,
      title:      user.title,
      level:      user.level,
      xp:         user.xp,
      xpMax:      user.xpMax,
      streak:     user.streak,
      questsDone: user.questsDone,
      combo:      user.combo,
      achievements,
    });
  } catch (err) {
    console.error("[earn] /api/me failed, returning demo player:", err);
    return res.status(200).json({
      handle: "ZoBuilder_01",
      title: "Bounty Hunter",
      level: 12,
      xp: 2340,
      xpMax: 3000,
      streak: 7,
      questsDone: 18,
      combo: 3,
      achievements: [
        { id: "first-blood",  label: "First Blood",   desc: "First quest claimed",     icon: "IconSwords",  color: "#FF9E4C", unlocked: true  },
        { id: "centurion",    label: "Centurion",     desc: "100 contributions",       icon: "IconShield",  color: "#6A77DD", unlocked: true  },
        { id: "streak-7",     label: "Week Warrior",  desc: "7-day streak",            icon: "IconFlame",   color: "#FFD600", unlocked: true  },
        { id: "whale",        label: "Whale",         desc: "Earn $10k+",              icon: "IconDiamond", color: "#9803CE", unlocked: false },
        { id: "legendary",    label: "Legendary",     desc: "Claim a legendary quest", icon: "IconCrown",   color: "#CFFF50", unlocked: false },
        { id: "sharpshooter", label: "Sharpshooter",  desc: "5 wins in a row",         icon: "IconTarget",  color: "#66DF48", unlocked: true  },
        { id: "guild-master", label: "Guild Master",  desc: "Invite 10 builders",      icon: "IconMedal",   color: "#FF2F8E", unlocked: false },
        { id: "apex",         label: "Apex",          desc: "Reach level 50",          icon: "IconTrophy",  color: "#FF4545", unlocked: false },
      ],
    });
  }
}
