import type { NextApiRequest, NextApiResponse } from 'next';

const OPS_BACKEND_URL = 'https://zo.xyz/ops-backend/api/analytics/nl-query';

/**
 * Fetch public profile data by nickname/handle.
 * GET /api/public-profile?handle=samurai
 *
 * Returns public-safe fields only (no email, phone, name).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const handle = req.query.handle as string;
  if (!handle) {
    return res.status(400).json({ error: 'handle parameter required' });
  }

  // Search by nick_name in proc_user_data_plus
  const sql = `SELECT user_id, full_name, nick_name, home_city, nationality,
    nights_stayed, CAST(destinations_unlocked AS int) AS destinations_unlocked,
    CAST(zostels_stayed_in AS int) AS zostels_stayed_in, CAST(tribe_count AS int) AS tribe_count,
    mobile_verified, email_verified, identity_verified,
    gender, birthday, cultures, identity_type, passport_number
    FROM proc_user_data_plus
    WHERE LOWER(nick_name) = LOWER('${handle.replace(/'/g, "''").replace('.zo', '')}')
    LIMIT 1`;

  try {
    const upstream = await fetch(OPS_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: `Run this exact SQL: ${sql}` }),
    });

    const data = await upstream.json();

    if (!data.success || !data.data?.rows?.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = data.data.rows[0];

    // Compute XP (same formula as leaderboard)
    let xp = 0;
    xp += (Number(row.nights_stayed) || 0) * 50;
    xp += (Number(row.destinations_unlocked) || 0) * 150;
    xp += (Number(row.zostels_stayed_in) || 0) * 100;
    xp += (Number(row.tribe_count) || 0) * 10;
    const profileFields = ['full_name', 'nick_name', 'birthday', 'gender', 'home_city', 'nationality', 'cultures', 'identity_type', 'passport_number'];
    for (const f of profileFields) {
      if (row[f] != null && row[f] !== '') xp += 10;
    }
    if (row.mobile_verified) xp += 15;
    if (row.email_verified) xp += 15;
    if (row.identity_verified) xp += 15;

    // Compute rank title
    let rankTitle = 'Citizen';
    if (xp >= 50000) rankTitle = 'Legend';
    else if (xp >= 25000) rankTitle = 'Trailblazer';
    else if (xp >= 10000) rankTitle = 'Voyager';
    else if (xp >= 5000) rankTitle = 'Explorer';
    else if (xp >= 2000) rankTitle = 'Adventurer';
    else if (xp >= 500) rankTitle = 'Wanderer';

    // Return PUBLIC fields only
    const publicProfile = {
      handle: row.nick_name || null,
      city: row.home_city || null,
      nationality: row.nationality || null,
      xp,
      rankTitle,
      stats: {
        nights: Number(row.nights_stayed) || 0,
        destinations: Number(row.destinations_unlocked) || 0,
        properties: Number(row.zostels_stayed_in) || 0,
        tribe: Number(row.tribe_count) || 0,
      },
    };

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(publicProfile);
  } catch (err) {
    return res.status(500).json({ error: 'Profile fetch failed' });
  }
}
