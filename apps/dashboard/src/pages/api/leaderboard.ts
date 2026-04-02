import type { NextApiRequest, NextApiResponse } from 'next';

const OPS_BACKEND_URL = 'https://zo.xyz/ops-backend/api/analytics/nl-query';

// Season configuration
const SEASONS = [
  { id: 's1', name: 'Season 1', start: '2026-04-01', end: '2026-04-30', active: true },
] as const;

function getCurrentSeason() {
  const now = new Date().toISOString().slice(0, 10);
  return SEASONS.find(s => now >= s.start && now <= s.end) || null;
}

// ── Verified stay stats from proc_checkout2_mv ──
// Guards:
//   - max 180 days per booking (kills ghost bookings that were never closed)
//   - checkout capped at today (kills future dates like 2033)
//   - phone must be 10+ digits (kills junk: null, '0', '91', '911')
//   - exclude all-zero phones
//   - row_dedupe = 1 (no duplicate rows)
//   - HAVING COUNT(DISTINCT bg_name) < 5 filters shared OTA placeholder phones
const STAYS_SQL = `SELECT bg_mobile,
  SUM(GREATEST(LEAST(cb_checkout_date::date, CURRENT_DATE) - cb_checkin_date::date, 0)) AS nights_stayed,
  COUNT(DISTINCT cb_booking_code) AS total_bookings,
  COUNT(DISTINCT operator_name) AS zostels_stayed_in,
  COUNT(DISTINCT cb_operator_id) AS destinations_unlocked,
  MIN(cb_checkin_date)::date AS first_stay,
  MAX(cb_checkin_date)::date AS last_stay
FROM proc_checkout2_mv
WHERE (cb_checkout_date::date - cb_checkin_date::date) BETWEEN 0 AND 180
  AND row_dedupe = 1
  AND LENGTH(bg_mobile) >= 10
  AND bg_mobile !~ '^0+$'
GROUP BY bg_mobile
HAVING COUNT(DISTINCT bg_name) < 5
ORDER BY nights_stayed DESC
LIMIT 500`;

// For seasonal: add a date filter on checkin
function staysSqlWithSeason(seasonStart: string): string {
  return STAYS_SQL.replace(
    'AND row_dedupe = 1',
    `AND row_dedupe = 1\n  AND cb_checkin_date >= '${seasonStart}'`
  );
}

// ── Profile data from proc_user_data (base table, not _plus) ──
// Joined by mobile_number. We fetch for all phones from the stays query.
function profileSql(phones: string[]): string {
  const right10 = phones.map(p => p.slice(-10)).filter(p => p.length === 10);
  const uniquePhones = [...new Set(right10)];
  const phoneList = uniquePhones.map(p => `'${p}'`).join(',');

  // Keep columns minimal to stay under 1000-char nl-query limit
  return `SELECT mobile_number, user_id, full_name, nick_name, home_city, nationality,
    mobile_verified, email_verified, identity_verified,
    gender, birthday, email, cultures, identity_type, passport_number
  FROM proc_user_data
  WHERE mobile_number IN (${phoneList}) AND rn_same_full_mobile = 1`;
}

// ── Tribe counts from proc_user_data_plus (tribe is computed from booking co-guests, not affected by nights bug) ──
function tribeSql(phones: string[]): string {
  const right10 = phones.map(p => p.slice(-10)).filter(p => p.length === 10);
  const uniquePhones = [...new Set(right10)];
  const phoneList = uniquePhones.map(p => `'${p}'`).join(',');

  return `SELECT mobile_number, CAST(tribe_count AS int) AS tribe_count
  FROM proc_user_data_plus
  WHERE mobile_number IN (${phoneList})
    AND is_generic_phone = false`;
}

// XP formula — matches Erum's PRD
function computeXp(stats: { nights: number; destinations: number; properties: number; tribe: number }, profileFields: Record<string, any>): number {
  let xp = 0;

  // Travel
  xp += stats.nights * 50;
  xp += stats.destinations * 150;
  xp += stats.properties * 100;
  xp += stats.tribe * 10;

  // Profile completion (10 XP each)
  const fields = ['full_name', 'nick_name', 'birthday', 'gender', 'mobile_number', 'email', 'home_city', 'nationality', 'cultures', 'identity_type', 'passport_number'];
  for (const f of fields) {
    if (profileFields[f] != null && profileFields[f] !== '') xp += 10;
  }

  // Verification (15 XP each)
  if (profileFields.mobile_verified) xp += 15;
  if (profileFields.email_verified) xp += 15;
  if (profileFields.identity_verified) xp += 15;

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const scope = (req.query.scope as string) || 'global';
  if (!['global', 'city', 'country'].includes(scope)) {
    return res.status(400).json({ error: 'Invalid scope. Use: global, city, country' });
  }

  const time = (req.query.time as string) || 'all-time';
  const filterValue = req.query.filter as string | undefined;
  const season = time === 'season' ? getCurrentSeason() : null;

  try {
    // ── Step 1: Fetch verified stay stats ──
    const staysSql = season ? staysSqlWithSeason(season.start) : STAYS_SQL;
    const stayRows = await queryAnalytics(staysSql, auth);

    if (stayRows.length === 0) {
      return res.status(200).json({
        scope, time: season ? season.id : 'all-time', season, count: 0, leaderboard: [],
      });
    }

    // ── Step 2: Fetch profiles + tribe in parallel ──
    const phones = stayRows.map((r: any) => r.bg_mobile as string);

    // Split into chunks of 40 to stay under nl-query's 1000 char limit
    // (~341 chars base SQL + ~14 chars per phone = 40 phones * 14 = 560 + 341 = 901 chars)
    const chunkSize = 40;
    const phoneChunks: string[][] = [];
    for (let i = 0; i < phones.length; i += chunkSize) {
      phoneChunks.push(phones.slice(i, i + chunkSize));
    }

    const profileMap = new Map<string, any>();
    const tribeMap = new Map<string, number>();

    await Promise.all(phoneChunks.map(async (chunk) => {
      const [profileRows, tribeRows] = await Promise.all([
        queryAnalytics(profileSql(chunk), auth),
        queryAnalytics(tribeSql(chunk), auth),
      ]);

      for (const row of profileRows) {
        profileMap.set(row.mobile_number, row);
      }
      for (const row of tribeRows) {
        tribeMap.set(row.mobile_number, Number(row.tribe_count) || 0);
      }
    }));

    // ── Step 3: Join stays + profiles in JS ──
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

      const xp = computeXp(stats, profile);

      return {
        userId: profile.user_id || null,
        name: profile.full_name || stay.bg_mobile,
        handle: profile.nick_name || profile.custom_nickname || null,
        xp,
        rankTitle: '',
        city: profile.home_city || null,
        nationality: profile.nationality || null,
        stats,
      };
    });

    // ── Step 4: Sort by XP, apply scope filters, rank ──
    entries.sort((a: any, b: any) => b.xp - a.xp);

    // Apply city/country scope filter
    let filtered = entries;
    if (scope === 'city' && filterValue) {
      filtered = entries.filter((e: any) => e.city && e.city.toLowerCase() === filterValue.toLowerCase());
    } else if (scope === 'country' && filterValue) {
      filtered = entries.filter((e: any) => {
        const nat = String(e.nationality || '').toLowerCase();
        const fv = filterValue.toLowerCase();
        return nat === fv || nat.includes(fv);
      });
    }

    const ranked = filtered
      .slice(0, 100)
      .map((entry: any, i: number) => ({
        ...entry,
        rank: i + 1,
        rankTitle: computeRankTitle(entry.xp),
      }));

    // Group counts for city/country scopes
    let groupedBy: Record<string, number> | undefined;
    if ((scope === 'city' || scope === 'country') && !filterValue) {
      groupedBy = {};
      const field = scope === 'city' ? 'city' : 'nationality';
      for (const entry of ranked) {
        const key = entry[field] || 'Unknown';
        groupedBy[key] = (groupedBy[key] || 0) + 1;
      }
    }

    // Cache for 15 minutes (data changes only on MV refresh)
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      scope,
      time: time === 'season' && season ? season.id : 'all-time',
      season: season ? { id: season.id, name: season.name, start: season.start, end: season.end } : null,
      count: ranked.length,
      leaderboard: ranked,
      ...(groupedBy ? { groups: groupedBy } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Leaderboard fetch failed' });
  }
}
