import type { NextApiRequest, NextApiResponse } from 'next';

const ZO_API = process.env.API_BASE_URL || 'https://api.io.zo.xyz';

/**
 * Fetches the current user's roles from Zo Auth API.
 * Forwards all device headers so the Zo API accepts the request.
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
    const headers: Record<string, string> = { Authorization: auth };

    // Forward device headers required by Zo API
    const deviceId = req.headers['client-device-id'] as string;
    const deviceSecret = req.headers['client-device-secret'] as string;
    const clientKey = req.headers['client-key'] as string;
    if (deviceId) headers['client-device-id'] = deviceId;
    if (deviceSecret) headers['client-device-secret'] = deviceSecret;
    if (clientKey) headers['client-key'] = clientKey;

    const userRes = await fetch(`${ZO_API}/api/v1/auth/user/`, { headers });

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
