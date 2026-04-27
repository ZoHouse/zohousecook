import type { NextApiRequest, NextApiResponse } from "next";
import {
  cancelPendingPost,
  getPost,
  updatePost,
} from "../../../lib/store";
import { postTweet } from "../../../lib/x-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "id required" });
  }

  try {
    if (req.method === "DELETE") {
      const ok = await cancelPendingPost(id);
      if (!ok) {
        return res
          .status(409)
          .json({ error: "post not found or not pending" });
      }
      return res.status(200).json({ ok: true });
    }

    // POST = post immediately, ignore schedule.
    if (req.method === "POST") {
      const post = await getPost(id);
      if (!post) return res.status(404).json({ error: "not found" });
      if (post.status === "posted") {
        return res.status(409).json({ error: "already posted" });
      }
      try {
        const { tweetId } = await postTweet(post.content);
        const updated = await updatePost(id, {
          status: "posted",
          posted_at: new Date().toISOString(),
          x_tweet_id: tweetId,
          attempt_count: (post.attempt_count ?? 0) + 1,
          error: null,
        });
        return res.status(200).json({ post: updated });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updatePost(id, {
          status: "failed",
          error: msg.slice(0, 1000),
          attempt_count: (post.attempt_count ?? 0) + 1,
        });
        console.error("[social-engine] post-now failed:", msg);
        return res.status(502).json({ error: msg });
      }
    }

    res.setHeader("Allow", "DELETE, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[social-engine] /api/posts/[id] error:", e);
    return res.status(500).json({ error: msg });
  }
}
