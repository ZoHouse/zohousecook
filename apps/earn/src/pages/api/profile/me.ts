import type { NextApiRequest, NextApiResponse } from "next";
import { getUser } from "@/lib/auth";
import { getMockSelfProfile } from "@/lib/mock-builders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const identity = await getUser(req);
  if (!identity) return res.status(401).json({ error: "not signed in" });

  const profile = getMockSelfProfile(identity.profile.handle);
  return res.status(200).json(profile);
}
