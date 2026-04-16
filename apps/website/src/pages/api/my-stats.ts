import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Computes user XP and travel stats from Zostel + Zo REST APIs.
 *
 * Client must send:
 *   Authorization: Bearer <zo-token>       (Zo API — profile)
 *   x-zostel-token: <zostel-jwt>           (Zostel API — bookings)
 *   x-zostel-user-id: <zostel-user-id>     (Zostel API — Client-User-Id)
 *
 * No PostgreSQL analytics DB. All data from REST APIs.
 */

const ZO_API = process.env.API_BASE_URL || 'https://api.io.zo.xyz';
const ZOSTEL_API = process.env.API_BASE_URL_ZOSTEL || 'https://api.zostel.com';
const ZOSTEL_APP_ID = process.env.ZOSTEL_APP_ID || '';

const PROFILE_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'gender', 'bio',
  'address', 'country', 'home_location', 'avatar', 'pfp_image',
  'mobile_number', 'email_address',
] as const;

interface StayBooking {
  status: string;
  checkin: string;
  checkout: string;
  paid_amount?: number;
  operator?: { code?: string; name?: string };
}

interface StatsResponse {
  xp: number;
  rankTitle: string;
  rank: null;
  city: string | null;
  createdAt: string | null;
  tribeMembers: string[];
  destinationNames: string[];
  zostelNames: string[];
  tripDestinations: string[];
  stats: {
    nights: number;
    destinations: number;
    properties: number;
    tribe: number;
    trips: number;
    tripNights: number;
  };
}

const EMPTY: StatsResponse = {
  xp: 0, rankTitle: 'Citizen', rank: null,
  city: null, createdAt: null, tribeMembers: [], destinationNames: [], zostelNames: [],
  tripDestinations: [],
  stats: { nights: 0, destinations: 0, properties: 0, tribe: 0, trips: 0, tripNights: 0 },
};

function getRankTitle(xp: number): string {
  if (xp >= 20000) return 'Legend';
  if (xp >= 10000) return 'Explorer';
  if (xp >= 5000) return 'Adventurer';
  if (xp >= 2000) return 'Traveler';
  if (xp >= 500) return 'Wanderer';
  return 'Citizen';
}

async function fetchZostelBookings(
  zostelToken: string,
  zostelUserId: string,
): Promise<{ nights: number; properties: string[]; destinations: string[]; spend: number }> {
  const bookings: StayBooking[] = [];
  let url = `${ZOSTEL_API}/api/v1/stay/my/bookings/list/?limit=100`;

  while (url && bookings.length < 1000) {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${zostelToken}`,
        'Client-User-Id': zostelUserId,
        'Client-App-Id': ZOSTEL_APP_ID,
      },
    });
    if (!resp.ok) break;
    const data = await resp.json();
    bookings.push(...(data.results || []));
    url = data.next || '';
    if (url && url.startsWith('http://')) url = url.replace('http://', 'https://');
  }

  const valid = bookings.filter(
    (b) => b.status === 'checked_out' || b.status === 'checked_in' || b.status === 'confirmed',
  );

  let nights = 0;
  let spend = 0;
  const propertySet = new Set<string>();
  const destinationSet = new Set<string>();

  // Neighborhoods → parent city. Prevents Koramangala/Whitefield/Indiranagar
  // from showing as separate "cities" when they're all Bangalore.
  const CITY_ALIASES: Record<string, string> = {
    'koramangala': 'Bangalore',
    'whitefield': 'Bangalore',
    'indiranagar': 'Bangalore',
    'hsr layout': 'Bangalore',
    'rajgundha': 'Barot',
    'mohanchatti': 'Rishikesh',
    'stok': 'Leh',
    'naina range': 'Nainital',
    'karapuzha': 'Wayanad',
    'thirunelly': 'Wayanad',
    'vythiri': 'Wayanad',
    'old manali': 'Manali',
    'goshal road': 'Manali',
    'pangan': 'Manali',
  };

  // Garbage property names from closed/test/renamed operators — skip entirely.
  // Checked as substring match so "Double Old" catches "Double Old Manali" etc.
  const IGNORE_SUBSTRINGS = ['double old', 'alleppeyyy', 'aurangabaddd', 'test '];

  // Also exact-match these
  const IGNORE_EXACT = new Set(['old', 'test']);

  function resolveCity(raw: string): string | null {
    const lower = raw.toLowerCase().trim();
    if (IGNORE_EXACT.has(lower)) return null;
    if (IGNORE_SUBSTRINGS.some((s) => lower.includes(s))) return null;
    return CITY_ALIASES[lower] ?? raw;
  }

  for (const b of valid) {
    if (b.checkin && b.checkout) {
      const ci = new Date(b.checkin);
      const co = new Date(b.checkout);
      const n = Math.max(0, Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
      if (n <= 365) nights += n;
    }
    if (b.paid_amount) spend += Number(b.paid_amount) || 0;
    if (b.operator?.code) propertySet.add(b.operator.code);
    if (b.operator?.name) {
      const name = b.operator.name;
      const parenMatch = name.match(/\(([^)]+)\)/);
      let city: string | null = null;
      if (parenMatch) {
        city = resolveCity(parenMatch[1].trim());
      } else {
        const parts = name.split(/\s+/);
        if (parts.length > 1) city = resolveCity(parts[parts.length - 1]);
      }
      if (city) destinationSet.add(city);
    }
  }

  return {
    nights,
    properties: [...propertySet],
    destinations: [...destinationSet].sort(),
    spend,
  };
}

async function fetchProfileStats(
  zoToken: string,
  deviceId: string,
  deviceSecret: string,
): Promise<{ fieldsFilled: number; verifications: number; city: string | null; createdAt: string | null }> {
  const resp = await fetch(`${ZO_API}/api/v1/profile/me/`, {
    headers: {
      Authorization: `Bearer ${zoToken}`,
      'client-device-id': deviceId,
      'client-device-secret': deviceSecret,
      'client-key': process.env.APP_ID || '',
    },
  });
  if (!resp.ok) return { fieldsFilled: 0, verifications: 0, city: null, createdAt: null };

  const profile = await resp.json();

  let fieldsFilled = 0;
  for (const field of PROFILE_FIELDS) {
    const val = profile[field];
    if (val && val !== '' && val !== null && val !== undefined) fieldsFilled++;
  }

  let verifications = 0;
  if (profile.mobile_verified) verifications++;
  if (profile.email_verified) verifications++;
  if (profile.web3_verified || profile.identity_verified) verifications++;

  return {
    fieldsFilled,
    verifications,
    city: profile.place_name || profile.city || null,
    createdAt: profile.date_joined || null,
  };
}

async function fetchTripStats(
  userUuid: string,
): Promise<{ trips: number; tripNights: number; tripDestinations: string[] }> {
  const CAS_TOKEN = process.env.ZO_CAS_TOKEN;
  if (!CAS_TOKEN) return { trips: 0, tripNights: 0, tripDestinations: [] };

  try {
    const bookings: any[] = [];
    let url = `${ZO_API}/api/v1/cas/trip/bookings/?user=${userUuid}&limit=100`;

    while (url && bookings.length < 500) {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${CAS_TOKEN}` },
      });
      if (!resp.ok) break;
      const data = await resp.json();
      bookings.push(...(data.results || []));
      url = data.next || '';
      if (url && url.startsWith('http://')) url = url.replace('http://', 'https://');
    }

    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');

    let tripNights = 0;
    const destinationSet = new Set<string>();

    for (const booking of confirmed) {
      if (booking.start_at && booking.end_at) {
        const start = new Date(booking.start_at);
        const end = new Date(booking.end_at);
        tripNights += Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }
      for (const sku of (booking.booked_skus || [])) {
        const invName = sku?.sku?.inventory?.name || sku?.sku?.name || '';
        if (invName) {
          const clean = invName.replace(/^Experience\s+/i, '').replace(/\s*\(.*?\)\s*/g, '').trim();
          if (clean) destinationSet.add(clean);
        }
      }
    }

    return { trips: confirmed.length, tripNights, tripDestinations: [...destinationSet].sort() };
  } catch {
    return { trips: 0, tripNights: 0, tripDestinations: [] };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const zoToken = (req.headers.authorization || '').replace('Bearer ', '');
  const zostelToken = req.headers['x-zostel-token'] as string | undefined;
  const zostelUserId = req.headers['x-zostel-user-id'] as string | undefined;
  const deviceId = req.headers['client-device-id'] as string || '';
  const deviceSecret = req.headers['client-device-secret'] as string || '';
  const userUuid = req.query.userId as string | undefined;

  if (!zoToken) {
    return res.status(200).json(EMPTY);
  }

  try {
    const [stays, profile, trips] = await Promise.all([
      zostelToken && zostelUserId
        ? fetchZostelBookings(zostelToken, zostelUserId)
        : Promise.resolve({ nights: 0, properties: [] as string[], destinations: [] as string[], spend: 0 }),
      fetchProfileStats(zoToken, deviceId, deviceSecret),
      userUuid
        ? fetchTripStats(userUuid)
        : Promise.resolve({ trips: 0, tripNights: 0, tripDestinations: [] as string[] }),
    ]);

    const xpBreakdown = {
      nights: stays.nights * 50,
      destinations: stays.destinations.length * 150,
      properties: stays.properties.length * 100,
      profileFields: profile.fieldsFilled * 10,
      verifications: profile.verifications * 15,
      trips: trips.trips * 300,
      tripNights: trips.tripNights * 50,
    };
    const xp = Object.values(xpBreakdown).reduce((a, b) => a + b, 0);

    const result: StatsResponse = {
      xp,
      rankTitle: getRankTitle(xp),
      rank: null,
      city: profile.city,
      createdAt: profile.createdAt,
      tribeMembers: [],
      destinationNames: stays.destinations,
      zostelNames: stays.properties,
      tripDestinations: trips.tripDestinations,
      stats: {
        nights: stays.nights,
        destinations: stays.destinations.length,
        properties: stays.properties.length,
        tribe: 0,
        trips: trips.trips,
        tripNights: trips.tripNights,
      },
    };

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('my-stats error:', err.message);
    return res.status(200).json(EMPTY);
  }
}
