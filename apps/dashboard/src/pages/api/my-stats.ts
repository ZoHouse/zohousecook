import type { NextApiRequest, NextApiResponse } from 'next';

// PARKED: Analytics DB queries removed while backend builds the events table.
// This endpoint will be rebuilt on top of the atomic activity ledger.
// See: prior implementation in git history for reference.

const EMPTY = {
  xp: 0, rankTitle: 'Citizen', rank: null,
  city: null, createdAt: null, tribeMembers: [], destinationNames: [], zostelNames: [],
  tripDestinations: [],
  stats: { nights: 0, destinations: 0, properties: 0, tribe: 0, trips: 0, tripNights: 0 },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=60');
  return res.status(200).json(EMPTY);
}
