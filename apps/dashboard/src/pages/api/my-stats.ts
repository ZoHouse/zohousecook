import type { NextApiRequest, NextApiResponse } from 'next';
import { queryAnalytics } from '../../lib/analytics-db';

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

const EMPTY = {
  xp: 0, rankTitle: 'Citizen', rank: null,
  city: null, createdAt: null, tribeMembers: [] as string[], destinationNames: [] as string[], zostelNames: [] as string[],
  stats: { nights: 0, destinations: 0, properties: 0, tribe: 0 },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = req.query.userId as string | undefined;
  const phone = req.query.phone as string | undefined;
  const nickname = req.query.nickname as string | undefined;

  try {
    // Step 1: Find user in proc_user_data_plus to get their mobile_number
    let where = '';
    if (userId) where = `user_id = '${userId.replace(/'/g, "''")}'`;
    if (!where && phone) {
      const clean = phone.replace(/^\+?91/, '');
      where = `mobile_number = '${clean.replace(/'/g, "''")}'`;
    }
    if (!where && nickname) {
      const clean = nickname.replace('.zo', '');
      where = `nick_name = '${clean.replace(/'/g, "''")}'`;
    }
    if (!where) return res.status(200).json(EMPTY);

    const profileRows = await queryAnalytics(
      `SELECT user_id, full_name, nick_name, mobile_number, home_city, nationality,
        mobile_verified, email_verified, identity_verified,
        gender, birthday, phone_number, email, cultures, passport_number,
        created_at, CAST(tribe_count AS int) AS tribe_count,
        tribe_members_names, destination_names, zostel_names
      FROM proc_user_data_plus WHERE ${where} LIMIT 1`
    );

    if (profileRows.length === 0) return res.status(200).json(EMPTY);
    const profile = profileRows[0];
    const mobile = profile.mobile_number;

    // Step 2: Verified stays from proc_checkout2_mv
    const stayRows = await queryAnalytics(
      `SELECT
        SUM(GREATEST(LEAST(cb_checkout_date::date, CURRENT_DATE) - cb_checkin_date::date, 0)) AS nights_stayed,
        COUNT(DISTINCT operator_name) AS zostels_stayed_in,
        COUNT(DISTINCT cb_operator_id) AS destinations_unlocked
      FROM proc_checkout2_mv
      WHERE RIGHT(bg_mobile, 10) = '${mobile.replace(/'/g, "''")}'
        AND (cb_checkout_date::date - cb_checkin_date::date) BETWEEN 0 AND 180
        AND row_dedupe = 1`
    );

    const stay = stayRows[0] || {};
    const stats = {
      nights: Number(stay.nights_stayed) || 0,
      destinations: Number(stay.destinations_unlocked) || 0,
      properties: Number(stay.zostels_stayed_in) || 0,
      tribe: Number(profile.tribe_count) || 0,
    };

    // Step 3: Compute XP
    let xp = stats.nights * 50 + stats.destinations * 150 + stats.properties * 100 + stats.tribe * 10;
    const fields = ['full_name', 'nick_name', 'birthday', 'gender', 'phone_number', 'email', 'home_city', 'nationality', 'cultures', 'passport_number'];
    for (const f of fields) {
      if (profile[f] != null && profile[f] !== '') xp += 10;
    }
    if (profile.mobile_verified) xp += 15;
    if (profile.email_verified) xp += 15;
    if (profile.identity_verified && profile.identity_verified !== '') xp += 15;

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      xp,
      rankTitle: computeRankTitle(xp),
      rank: null,
      city: profile.home_city || null,
      createdAt: profile.created_at || null,
      tribeMembers: parseCsv(profile.tribe_members_names, 3),
      destinationNames: parseCsv(profile.destination_names),
      zostelNames: parseCsv(profile.zostel_names),
      stats,
    });
  } catch (err: any) {
    console.error('My-stats error:', err.message);
    return res.status(500).json({ error: 'Stats fetch failed', detail: err.message });
  }
}
