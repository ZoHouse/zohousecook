import type { NextApiRequest, NextApiResponse } from "next";

const UPSTREAM = "https://chemistry.zozozo.work";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/api/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body ?? {}),
    });
    const body = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(body);
  } catch (e: any) {
    return res.status(502).json({ error: "upstream_error", detail: e?.message });
  }
}
