import type { NextApiRequest, NextApiResponse } from "next";
import { createPost, listPosts } from "../../../lib/store";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const posts = await listPosts();
      return res.status(200).json({ posts });
    }

    if (req.method === "POST") {
      const { content, scheduled_at } = req.body ?? {};
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "content required" });
      }
      if (content.length > 280) {
        return res.status(400).json({ error: "content exceeds 280 chars" });
      }
      if (
        typeof scheduled_at !== "string" ||
        isNaN(Date.parse(scheduled_at))
      ) {
        return res
          .status(400)
          .json({ error: "scheduled_at must be ISO datetime" });
      }
      const post = await createPost({
        content: content.trim(),
        scheduled_at: new Date(scheduled_at).toISOString(),
      });
      return res.status(201).json({ post });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[social-engine] /api/posts error:", e);
    return res.status(500).json({ error: msg });
  }
}
