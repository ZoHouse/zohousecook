import type { NextApiRequest, NextApiResponse } from 'next';

const OPS_BACKEND_URL = 'https://zo.xyz/ops-backend/api/analytics/nl-query';

// Fetch raw user data from analytics DB, compute XP in JS
// We fetch broadly (no ORDER BY nights — XP depends on multiple factors)
const BASE_SQL = `SELECT user_id, full_name, nick_name, home_city, nationality,
nights_stayed, CAST(destinations_unlocked AS int) AS destinations_unlocked,
CAST(zostels_stayed_in AS int) AS zostels_stayed_in, CAST(tribe_count AS int) AS tribe_count,
mobile_verified, email_verified, identity_verified,
gender, birthday, phone_number, email, cultures, identity_type, passport_number
FROM proc_user_data_plus
WHERE (nights_stayed > 0 OR CAST(tribe_count AS int) > 0 OR CAST(destinations_unlocked AS int) > 0)
AND nights_stayed < 10000
AND is_generic_phone = false
AND full_name IS NOT NULL AND full_name != ''
AND mobile_number IS NOT NULL AND mobile_number != '' AND mobile_number != '0000000000'`;

const SCOPE_FILTER: Record<string, string> = {
  global: '',
  city: ` AND home_city IS NOT NULL AND home_city != ''`,
  country: ` AND nationality IS NOT NULL AND nationality != ''`,
};

// XP formula — matches Erum's PRD
function computeXp(row: any): number {
  let xp = 0;

  // Travel
  xp += (Number(row.nights_stayed) || 0) * 50;           // 50 XP per night
  xp += (Number(row.destinations_unlocked) || 0) * 150;  // 150 XP per destination
  xp += (Number(row.zostels_stayed_in) || 0) * 100;      // 100 XP per property
  xp += (Number(row.tribe_count) || 0) * 10;             // 10 XP per tribe member

  // Profile completion (10 XP each)
  const fields = ['full_name', 'nick_name', 'birthday', 'gender', 'phone_number', 'email', 'home_city', 'nationality', 'cultures', 'identity_type', 'passport_number'];
  for (const f of fields) {
    if (row[f] != null && row[f] !== '') xp += 10;
  }

  // Verification (15 XP each)
  if (row.mobile_verified) xp += 15;
  if (row.email_verified) xp += 15;
  if (row.identity_verified) xp += 15;

  return xp;
}

// Compute passport rank from XP
function computeRankTitle(xp: number): string {
  if (xp >= 50000) return 'Legend';
  if (xp >= 25000) return 'Trailblazer';
  if (xp >= 10000) return 'Voyager';
  if (xp >= 5000)  return 'Explorer';
  if (xp >= 2000)  return 'Adventurer';
  if (xp >= 500)   return 'Wanderer';
  return 'Citizen';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const scope = (req.query.scope as string) || 'global';
  const filter = SCOPE_FILTER[scope];
  if (filter === undefined) {
    return res.status(400).json({ error: 'Invalid scope. Use: global, city, country' });
  }

  // For city/country scopes, also accept a filter value (e.g. ?scope=city&filter=Bangalore)
  const filterValue = req.query.filter as string | undefined;

  let sql = `${BASE_SQL}${filter}`;

  // Apply specific city/country filter when provided
  if (scope === 'city' && filterValue) {
    sql += ` AND LOWER(home_city) = LOWER('${filterValue.replace(/'/g, "''")}')`;
  } else if (scope === 'country' && filterValue) {
    sql += ` AND LOWER(nationality) = LOWER('${filterValue.replace(/'/g, "''")}')`;
  }

  sql += ` LIMIT 500`;

  try {
    const upstream = await fetch(OPS_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: `Run this exact SQL: ${sql}`,
      }),
    });

    const data = await upstream.json();

    if (!data.success) {
      return res.status(502).json({ error: 'Analytics query failed', detail: data.error });
    }

    const rows = data.data?.rows || [];

    // Compute XP and sort
    const ranked = rows
      .map((row: any) => ({
        userId: row.user_id,
        name: row.full_name || row.nick_name || 'Anonymous',
        handle: row.nick_name || null,
        xp: computeXp(row),
        rankTitle: '',
        city: row.home_city || null,
        nationality: row.nationality || null,
        stats: {
          nights: Number(row.nights_stayed) || 0,
          destinations: Number(row.destinations_unlocked) || 0,
          properties: Number(row.zostels_stayed_in) || 0,
          tribe: Number(row.tribe_count) || 0,
        },
      }))
      .sort((a: any, b: any) => b.xp - a.xp)
      .slice(0, 100)
      .map((entry: any, i: number) => ({
        ...entry,
        rank: i + 1,
        rankTitle: computeRankTitle(entry.xp),
      }));

    // For city/country scopes without a specific filter, group by and return top per group
    let groupedBy: Record<string, number> | undefined;
    if ((scope === 'city' || scope === 'country') && !filterValue) {
      groupedBy = {};
      const field = scope === 'city' ? 'city' : 'nationality';
      for (const entry of ranked) {
        const key = entry[field] || 'Unknown';
        groupedBy[key] = (groupedBy[key] || 0) + 1;
      }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      scope,
      count: ranked.length,
      leaderboard: ranked,
      ...(groupedBy ? { groups: groupedBy } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Leaderboard fetch failed' });
  }
}
