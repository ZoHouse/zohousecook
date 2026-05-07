import type { NextApiRequest, NextApiResponse } from "next";
import { getMockPublicProfile } from "@/lib/mock-builders";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const handle = (req.query.handle as string) || "";
  if (!handle) return res.status(400).json({ error: "missing handle" });

  return res.status(200).json(getMockPublicProfile(handle));
}
