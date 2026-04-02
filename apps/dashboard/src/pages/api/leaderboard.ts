import type { NextApiRequest, NextApiResponse } from 'next';
import { queryAnalytics } from '../../lib/analytics-db';

// Season configuration
const SEASONS = [
  { id: 's1', name: 'Season 1', start: '2026-04-01', end: '2026-04-30', active: true },
] as const;

function getCurrentSeason() {
  const now = new Date().toISOString().slice(0, 10);
  return SEASONS.find(s => now >= s.start && now <= s.end) || null;
}

// Verified stay stats from proc_checkout2_mv with guards:
//   - max 365 days per booking (kills ghost bookings never closed, allows long-term residents)
//   - checkout capped at today (kills future dates)
//   - phone must be 10+ digits (kills junk: null, '0', '91')
//   - exclude all-zero phones
//   - row_dedupe = 1 (no duplicate rows)
//   - HAVING COUNT(DISTINCT bg_name) < 5 filters shared OTA placeholder phones
function staysSql(seasonStart?: string): string {
  let where = `WHERE (cb_checkout_date::date - cb_checkin_date::date) BETWEEN 0 AND 365
  AND row_dedupe = 1
  AND LENGTH(bg_mobile) >= 10
  AND bg_mobile !~ '^0+$'`;

  if (seasonStart) {
    where += `\n  AND cb_checkin_date >= '${seasonStart}'`;
  }

  return `SELECT bg_mobile,
  SUM(GREATEST(LEAST(cb_checkout_date::date, CURRENT_DATE) - cb_checkin_date::date, 0)) AS nights_stayed,
  COUNT(DISTINCT operator_name) AS zostels_stayed_in,
  COUNT(DISTINCT cb_operator_id) AS destinations_unlocked
FROM proc_checkout2_mv
${where}
GROUP BY bg_mobile
HAVING COUNT(DISTINCT bg_name) < 5
ORDER BY nights_stayed DESC
LIMIT 500`;
}

function computeXp(stats: { nights: number; destinations: number; properties: number; tribe: number }, profile: any): number {
  let xp = 0;
  xp += stats.nights * 50;
  xp += stats.destinations * 150;
  xp += stats.properties * 100;
  xp += stats.tribe * 10;

  const fields = ['full_name', 'nick_name', 'birthday', 'gender', 'phone_number', 'email', 'home_city', 'nationality', 'cultures', 'passport'];
  for (const f of fields) {
    if (profile[f] != null && profile[f] !== '') xp += 10;
  }
  if (profile.mobile_verified) xp += 15;
  if (profile.email_verified) xp += 15;
  if (profile.identity_verified && profile.identity_verified !== '') xp += 15;
  return xp;
}

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

  const scope = (req.query.scope as string) || 'global';
  if (!['global', 'city', 'country'].includes(scope)) {
    return res.status(400).json({ error: 'Invalid scope' });
  }

  const time = (req.query.time as string) || 'all-time';
  const filterValue = req.query.filter as string | undefined;
  const season = time === 'season' ? getCurrentSeason() : null;

  try {
    // Step 1: Verified stays
    const stayRows = await queryAnalytics(staysSql(season?.start));
    if (stayRows.length === 0) {
      return res.status(200).json({ scope, time: season?.id || 'all-time', season, count: 0, leaderboard: [] });
    }

    // Step 2: Get profiles + tribe for these phones
    const phones = stayRows.map((r: any) => (r.bg_mobile as string).slice(-10));
    const uniquePhones = [...new Set(phones.filter(p => p.length === 10))];
    const phoneList = uniquePhones.map(p => `'${p}'`).join(',');

    const [profileRows, tribeRows] = await Promise.all([
      queryAnalytics(`SELECT mobile_number, user_id, full_name, nick_name, custom_nickname,
        home_city, nationality, mobile_verified, email_verified, identity_verified,
        gender, birthday, phone_number, email, cultures, passport
        FROM proc_user_data WHERE mobile_number IN (${phoneList}) AND rn_same_full_mobile = 1`),
      queryAnalytics(`SELECT mobile_number, CAST(tribe_count AS int) AS tribe_count
        FROM proc_user_data_plus WHERE mobile_number IN (${phoneList}) AND is_generic_phone = false`),
    ]);

    const profileMap = new Map(profileRows.map((r: any) => [r.mobile_number, r]));
    const tribeMap = new Map(tribeRows.map((r: any) => [r.mobile_number, Number(r.tribe_count) || 0]));

    // Step 3: Join + compute XP
    const entries = stayRows.map((stay: any) => {
      const phone10 = (stay.bg_mobile as string).slice(-10);
      const profile = profileMap.get(phone10) || {};
      const tribe = tribeMap.get(phone10) || 0;

      const stats = {
        nights: Number(stay.nights_stayed) || 0,
        destinations: Number(stay.destinations_unlocked) || 0,
        properties: Number(stay.zostels_stayed_in) || 0,
        tribe,
      };

      return {
        userId: profile.user_id || null,
        name: profile.full_name || 'Traveler',
        handle: profile.nick_name || profile.custom_nickname || null,
        xp: computeXp(stats, profile),
        rankTitle: '',
        city: profile.home_city || null,
        nationality: profile.nationality || null,
        stats,
      };
    });

    // Step 4: Sort, filter scope, rank
    entries.sort((a: any, b: any) => b.xp - a.xp);

    let filtered = entries;
    if (scope === 'city' && filterValue) {
      filtered = entries.filter((e: any) => e.city && e.city.toLowerCase() === filterValue.toLowerCase());
    } else if (scope === 'country' && filterValue) {
      filtered = entries.filter((e: any) => e.nationality && e.nationality.toLowerCase() === filterValue.toLowerCase());
    }

    const ranked = filtered.slice(0, 100).map((entry: any, i: number) => ({
      ...entry,
      rank: i + 1,
      rankTitle: computeRankTitle(entry.xp),
    }));

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      scope,
      time: season?.id || 'all-time',
      season: season ? { id: season.id, name: season.name, start: season.start, end: season.end } : null,
      count: ranked.length,
      leaderboard: ranked,
    });
  } catch (err: any) {
    console.error('Leaderboard error:', err.message);
    return res.status(500).json({ error: 'Leaderboard fetch failed', detail: err.message });
  }
}
