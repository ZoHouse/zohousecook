import type { NextApiRequest, NextApiResponse } from 'next';

const ZO_API = process.env.API_BASE_URL || 'https://api.io.zo.xyz';

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

    const deviceId = req.headers['client-device-id'] as string;
    const deviceSecret = req.headers['client-device-secret'] as string;
    const clientKey = req.headers['client-key'] as string;
    if (deviceId) headers['client-device-id'] = deviceId;
    if (deviceSecret) headers['client-device-secret'] = deviceSecret;
    if (clientKey) headers['client-key'] = clientKey;

    const upstream = await fetch(`${ZO_API}/api/v2/places/whereabouts/`, { headers });

    if (upstream.status === 404) {
      return res.status(200).json(null);
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Failed to fetch whereabouts' });
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Whereabouts fetch failed' });
  }
}
