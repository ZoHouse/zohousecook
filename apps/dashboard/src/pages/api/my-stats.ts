import type { NextApiRequest, NextApiResponse } from 'next';

const OPS_BACKEND_URL = 'https://zo.xyz/ops-backend/api/analytics/nl-query';

/**
 * Fetch the current user's travel stats + XP.
 * Unlike the leaderboard (top 1000), this always returns data for the authenticated user.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // First get the user's ID from their profile
  try {
    const profileRes = await fetch('https://api.io.zo.xyz/api/v1/profile/me/', {
      headers: { 'Authorization': auth },
    });
    if (!profileRes.ok) {
      return res.status(profileRes.status).json({ error: 'Failed to fetch profile' });
    }
    const profileData = await profileRes.json();
    const prof = profileData?.data || profileData;
    const userId = prof?.code;
    const pid = prof?.pid;
    const phone = prof?.mobile_number;
    const nickname = prof?.nickname || prof?.custom_nickname;

    // Build lookup — try user_id first, then PID, then phone, then nickname
    let whereClause = '';
    if (userId) {
      whereClause = `user_id = '${userId.replace(/'/g, "''")}'`;
    } else if (pid) {
      // PID is not in proc_user_data_plus, skip
      whereClause = '';
    }

    // Phone fallback — strip country code prefix if present
    if (!whereClause && phone) {
      const cleanPhone = phone.replace(/^\+?91/, '');
      whereClause = `mobile_number = '${cleanPhone.replace(/'/g, "''")}'`;
    }

    // Nickname fallback
    if (!whereClause && nickname) {
      const cleanNick = nickname.replace('.zo', '');
      whereClause = `nick_name = '${cleanNick.replace(/'/g, "''")}'`;
    }

    if (!whereClause) {
      return res.status(200).json({
        xp: 0, rankTitle: 'Citizen', rank: null,
        city: prof?.place_name || null, createdAt: prof?.created_at || null,
        stats: { nights: 0, destinations: 0, properties: 0, tribe: 0 },
      });
    }

    // Query user's stats from analytics DB
    const sql = `SELECT user_id, full_name, nick_name, home_city, nationality,
      nights_stayed, CAST(destinations_unlocked AS int) AS destinations_unlocked,
      CAST(zostels_stayed_in AS int) AS zostels_stayed_in, CAST(tribe_count AS int) AS tribe_count,
      mobile_verified, email_verified, identity_verified,
      gender, birthday, phone_number, email, cultures, identity_type, passport_number,
      created_at, tribe_members_names
      FROM proc_user_data_plus
      WHERE ${whereClause}
      LIMIT 1`;

    const upstream = await fetch(OPS_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: `Run this exact SQL: ${sql}` }),
    });

    const data = await upstream.json();
    const rows = data?.data?.rows || [];

    if (rows.length === 0) {
      // User exists in auth but not in analytics — return zeroes
      return res.status(200).json({
        xp: 0,
        rankTitle: 'Citizen',
        rank: null,
        city: prof?.place_name || null,
        createdAt: prof?.created_at || null,
        stats: { nights: 0, destinations: 0, properties: 0, tribe: 0 },
      });
    }

    const row = rows[0];

    // Compute XP
    let xp = 0;
    xp += (Number(row.nights_stayed) || 0) * 50;
    xp += (Number(row.destinations_unlocked) || 0) * 150;
    xp += (Number(row.zostels_stayed_in) || 0) * 100;
    xp += (Number(row.tribe_count) || 0) * 10;
    const fields = ['full_name', 'nick_name', 'birthday', 'gender', 'phone_number', 'email', 'home_city', 'nationality', 'cultures', 'identity_type', 'passport_number'];
    for (const f of fields) {
      if (row[f] != null && row[f] !== '') xp += 10;
    }
    if (row.mobile_verified) xp += 15;
    if (row.email_verified) xp += 15;
    if (row.identity_verified) xp += 15;

    // Rank title
    let rankTitle = 'Citizen';
    if (xp >= 50000) rankTitle = 'Legend';
    else if (xp >= 25000) rankTitle = 'Trailblazer';
    else if (xp >= 10000) rankTitle = 'Voyager';
    else if (xp >= 5000) rankTitle = 'Explorer';
    else if (xp >= 2000) rankTitle = 'Adventurer';
    else if (xp >= 500) rankTitle = 'Wanderer';

    // Parse tribe members (comma-separated names, take last 3)
    const tribeNames: string[] = row.tribe_members_names
      ? String(row.tribe_members_names).split(',').map((n: string) => n.trim()).filter(Boolean).slice(-3)
      : [];

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      xp,
      rankTitle,
      rank: null,
      city: row.home_city || null,
      createdAt: row.created_at || null,
      tribeMembers: tribeNames,
      stats: {
        nights: Number(row.nights_stayed) || 0,
        destinations: Number(row.destinations_unlocked) || 0,
        properties: Number(row.zostels_stayed_in) || 0,
        tribe: Number(row.tribe_count) || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Stats fetch failed' });
  }
}
