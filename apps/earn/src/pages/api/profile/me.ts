import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { getMockSelfProfile } from "@/lib/mock-builders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const identity = await getUser(req);
  if (!identity) return res.status(401).json({ error: "not signed in" });

  // Mock score / ships / products until ingest + scorer ship in PR #3 / #4.
  const mock = getMockSelfProfile(identity.profile.handle);

  // Real connected accounts (GitHub now, X later).
  const accounts = await prisma.builderAccount.findMany({
    where: { userId: identity.user.id },
    select: { provider: true, handle: true, connectedAt: true },
  });

  return res.status(200).json({
    ...mock,
    userId: identity.user.id,
    handle: identity.profile.handle,
    accounts: accounts.map((a) => ({
      provider: a.provider as "github" | "x",
      handle: a.handle,
      connectedAt: a.connectedAt.toISOString(),
    })),
  });
}
