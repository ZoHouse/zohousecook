import type { NextApiRequest, NextApiResponse } from "next";
import { getDuePosts, updatePost } from "../../../lib/store";
import { postTweet } from "../../../lib/x-client";

const MAX_PER_TICK = 5;

function authorized(req: NextApiRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.authorization || "";
  return header === `Bearer ${secret}`;
}

interface TickReport {
  picked: number;
  posted: string[];
  failed: { id: string; error: string }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!authorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const due = await getDuePosts(new Date().toISOString(), MAX_PER_TICK);
  const report: TickReport = { picked: due.length, posted: [], failed: [] };

  for (const row of due) {
    try {
      const { tweetId } = await postTweet(row.content);
      await updatePost(row.id, {
        status: "posted",
        posted_at: new Date().toISOString(),
        x_tweet_id: tweetId,
        attempt_count: (row.attempt_count ?? 0) + 1,
        error: null,
      });
      report.posted.push(row.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await updatePost(row.id, {
        status: "failed",
        error: msg.slice(0, 1000),
        attempt_count: (row.attempt_count ?? 0) + 1,
      });
      report.failed.push({ id: row.id, error: msg });
    }
  }

  return res.status(200).json(report);
}
