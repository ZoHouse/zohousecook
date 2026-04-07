import type { NextApiRequest, NextApiResponse } from 'next';

// Stub: leaderboard will be rebuilt on top of the atomic activity ledger.
// This prevents 404s from the website app's useLeaderboard hook.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=60');
  return res.status(200).json({
    scope: req.query.scope || 'global',
    time: 'all-time',
    season: null,
    count: 0,
    leaderboard: [],
  });
}
