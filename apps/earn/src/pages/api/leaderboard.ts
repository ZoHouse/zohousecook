import type { NextApiRequest, NextApiResponse } from "next";
import { getMockLeaderboard } from "@/lib/mock-builders";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const sortParam = (req.query.sort as string) || "ship";
  const sort = ["ship", "reach", "consistency"].includes(sortParam)
    ? (sortParam as "ship" | "reach" | "consistency")
    : "ship";

  const rows = getMockLeaderboard();
  rows.sort((a, b) => b.scores7d[sort] - a.scores7d[sort]);
  rows.forEach((r, i) => (r.rank = i + 1));

  return res.status(200).json({ rows, sort, windowDays: 7 });
}
