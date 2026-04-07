import type { NextApiRequest, NextApiResponse } from 'next';

// PARKED: Analytics DB removed. Public profile will be rebuilt on the atomic activity ledger.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const handle = req.query.handle as string;
  if (!handle) return res.status(400).json({ error: 'handle parameter required' });

  res.setHeader('Cache-Control', 's-maxage=60');
  return res.status(200).json({
    handle: handle.replace('.zo', '') || null,
    city: null,
    nationality: null,
    xp: 0,
    rankTitle: 'Citizen',
    stats: { nights: 0, destinations: 0, properties: 0, tribe: 0 },
  });
}
