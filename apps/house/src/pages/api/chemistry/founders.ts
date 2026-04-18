import type { NextApiRequest, NextApiResponse } from "next";

const UPSTREAM = "https://chemistry.zozozo.work";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const limit = typeof req.query.limit === "string" ? req.query.limit : "500";

  try {
    const upstream = await fetch(`${UPSTREAM}/api/founders?limit=${encodeURIComponent(limit)}`, {
      headers: { "Content-Type": "application/json" },
    });
    const body = await upstream.text();
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(body);
  } catch (e: any) {
    return res.status(502).json({ error: "upstream_error", detail: e?.message });
  }
}
