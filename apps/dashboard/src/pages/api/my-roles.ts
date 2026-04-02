import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Fetches the current user's roles from /api/v1/auth/user/.
 * Returns: { roles: string[], accessGroups: { id, name, role }[] }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Fetch user data which includes roles array
    const userRes = await fetch('https://api.io.zo.xyz/api/v1/auth/user/', {
      headers: { 'Authorization': auth },
    });

    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: 'Failed to fetch user' });
    }

    const userData = await userRes.json();
    const roles: string[] = userData?.roles || userData?.data?.roles || [];

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ roles });
  } catch (err) {
    return res.status(500).json({ error: 'Role fetch failed' });
  }
}
