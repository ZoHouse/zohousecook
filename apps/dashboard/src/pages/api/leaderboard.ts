import type { NextApiRequest, NextApiResponse } from 'next';

// PARKED: Analytics DB queries removed while backend builds the events table.
// Leaderboard will be rebuilt on top of the atomic activity ledger.
// See: prior implementation in git history for reference.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=60');
  return res.status(200).json({
    scope: 'global',
    time: 'all-time',
    season: null,
    count: 0,
    leaderboard: [],
  });
}
