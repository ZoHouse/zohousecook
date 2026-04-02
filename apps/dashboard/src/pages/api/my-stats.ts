import type { NextApiRequest, NextApiResponse } from 'next';

const OPS_BACKEND_URL = 'https://zo.xyz/ops-backend/api/analytics/nl-query';

async function queryAnalytics(sql: string, auth: string): Promise<any[]> {
  const upstream = await fetch(OPS_BACKEND_URL, {
    method: 'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: `Run this exact SQL: ${sql}` }),
  });
  const data = await upstream.json();
  if (!data.success) throw new Error(data.error || 'Analytics query failed');
  return data.data?.rows || [];
}

const EMPTY_STATS = {
  xp: 0, rankTitle: 'Citizen', rank: null,
  city: null, createdAt: null, tribeMembers: [], destinationNames: [], zostelNames: [],
  stats: { nights: 0, destinations: 0, properties: 0, tribe: 0 },
};

function computeRankTitle(xp: number): string {
  if (xp >= 50000) return 'Legend';
  if (xp >= 25000) return 'Trailblazer';
  if (xp >= 10000) return 'Voyager';
  if (xp >= 5000)  return 'Explorer';
  if (xp >= 2000)  return 'Adventurer';
  if (xp >= 500)   return 'Wanderer';
  return 'Citizen';
}

function parseCsv(val: any, limit?: number): string[] {
  if (!val) return [];
  const items = String(val).split(',').map((n: string) => n.trim()).filter(Boolean);
  return limit ? items.slice(-limit) : items;
}

/**
 * Fetch the current user's travel stats + XP.
 * Uses verified booking records from proc_checkout2_mv (with guards)
 * and profile data from proc_user_data + proc_user_data_plus (for tribe/names).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.query.userId as string | undefined;
  const phone = req.query.phone as string | undefined;
  const nickname = req.query.nickname as string | undefined;

  try {
    // ── Step 1: Find the user's phone number from proc_user_data ──
    let whereClause = '';
    if (userId) {
      whereClause = `user_id = '${userId.replace(/'/g, "''")}'`;
    }
    if (!whereClause && phone) {
      const cleanPhone = phone.replace(/^\+?91/, '');
      whereClause = `mobile_number = '${cleanPhone.replace(/'/g, "''")}'`;
    }
    if (!whereClause && nickname) {
      const cleanNick = nickname.replace('.zo', '');
      whereClause = `nick_name = '${cleanNick.replace(/'/g, "''")}'`;
    }

    if (!whereClause) {
      return res.status(200).json(EMPTY_STATS);
    }

    // Get profile + phone number
    const profileSql = `SELECT user_id, full_name, nick_name, mobile_number, home_city, nationality,
      mobile_verified, email_verified, identity_verified,
      gender, birthday, phone_number, email, cultures, identity_type, passport_number, created_at
    FROM proc_user_data
    WHERE ${whereClause} AND rn_same_full_mobile = 1
    LIMIT 1`;

    const profileRows = await queryAnalytics(profileSql, auth);

    if (profileRows.length === 0) {
      return res.status(200).json(EMPTY_STATS);
    }

    const profile = profileRows[0];
    const mobile = profile.mobile_number;

    // ── Step 2: Fetch verified stays + tribe/names in parallel ──
    // Verified stays from proc_checkout2_mv
    const staysSql = `SELECT
      SUM(GREATEST(LEAST(cb_checkout_date::date, CURRENT_DATE) - cb_checkin_date::date, 0)) AS nights_stayed,
      COUNT(DISTINCT cb_booking_code) AS total_bookings,
      COUNT(DISTINCT operator_name) AS zostels_stayed_in,
      COUNT(DISTINCT cb_operator_id) AS destinations_unlocked
    FROM proc_checkout2_mv
    WHERE RIGHT(bg_mobile, 10) = '${mobile.replace(/'/g, "''")}'
      AND (cb_checkout_date::date - cb_checkin_date::date) BETWEEN 0 AND 180
      AND row_dedupe = 1`;

    // Tribe + destination/zostel names from proc_user_data_plus (these fields aren't affected by the nights bug)
    const extraSql = `SELECT CAST(tribe_count AS int) AS tribe_count,
      tribe_members_names, destination_names, zostel_names
    FROM proc_user_data_plus
    WHERE mobile_number = '${mobile.replace(/'/g, "''")}'
    LIMIT 1`;

    const [stayRows, extraRows] = await Promise.all([
      queryAnalytics(staysSql, auth),
      queryAnalytics(extraSql, auth),
    ]);

    const stay = stayRows[0] || {};
    const extra = extraRows[0] || {};

    const stats = {
      nights: Number(stay.nights_stayed) || 0,
      destinations: Number(stay.destinations_unlocked) || 0,
      properties: Number(stay.zostels_stayed_in) || 0,
      tribe: Number(extra.tribe_count) || 0,
    };

    // ── Step 3: Compute XP ──
    let xp = 0;
    xp += stats.nights * 50;
    xp += stats.destinations * 150;
    xp += stats.properties * 100;
    xp += stats.tribe * 10;

    const fields = ['full_name', 'nick_name', 'birthday', 'gender', 'phone_number', 'email', 'home_city', 'nationality', 'cultures', 'identity_type', 'passport_number'];
    for (const f of fields) {
      if (profile[f] != null && profile[f] !== '') xp += 10;
    }
    if (profile.mobile_verified) xp += 15;
    if (profile.email_verified) xp += 15;
    if (profile.identity_verified) xp += 15;

    const rankTitle = computeRankTitle(xp);

    const tribeNames = parseCsv(extra.tribe_members_names, 3);
    const destinationNames = parseCsv(extra.destination_names);
    const zostelNames = parseCsv(extra.zostel_names);

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      xp,
      rankTitle,
      rank: null,
      city: profile.home_city || null,
      createdAt: profile.created_at || null,
      tribeMembers: tribeNames,
      destinationNames,
      zostelNames,
      stats,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Stats fetch failed' });
  }
}
