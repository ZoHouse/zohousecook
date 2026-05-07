import type { NextApiRequest, NextApiResponse } from "next";

const HEADER = "x-admin-key";

/**
 * Server-side gate for admin write routes. Returns true if request carries
 * the matching ADMIN_KEY. Sends 401 if not.
 *
 * Pair with UI-level Zo auth on /admin so we have two factors:
 *   1. /admin page only renders for Zo-logged-in users
 *   2. POST APIs only accept requests carrying ADMIN_KEY
 */
export function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    res.status(503).json({ error: "ADMIN_KEY not configured" });
    return false;
  }
  const provided = req.headers[HEADER];
  if (provided !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}
