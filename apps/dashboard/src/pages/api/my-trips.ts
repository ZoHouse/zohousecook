import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Fetches a user's Zo Trip bookings from the CAS API.
 * Returns: trip count, nights, unique destinations, destination names.
 * Uses server-side CAS token (admin) — user UUID passed as query param.
 */

const ZO_API = 'https://api.io.zo.xyz';
const CAS_TOKEN = process.env.ZO_CAS_TOKEN;

interface TripStats {
  trips: number;
  tripNights: number;
  tripDestinations: string[];
}

const EMPTY: TripStats = { trips: 0, tripNights: 0, tripDestinations: [] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userUuid = req.query.userUuid as string | undefined;
  if (!userUuid || !CAS_TOKEN) return res.status(200).json(EMPTY);

  try {
    // Fetch all confirmed + completed trip bookings for this user
    const bookings: any[] = [];
    let url = `${ZO_API}/api/v1/cas/trip/bookings/?user=${userUuid}&limit=100`;

    // Paginate (most users have <10 trips, but be safe)
    while (url && bookings.length < 500) {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${CAS_TOKEN}` },
      });
      if (!resp.ok) break;
      const data = await resp.json();
      bookings.push(...(data.results || []));
      url = data.next || '';
      // Fix http → https if needed
      if (url && url.startsWith('http://')) url = url.replace('http://', 'https://');
    }

    // Only count confirmed bookings (not abandoned/cancelled/requested)
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');

    let totalNights = 0;
    const destinationSet = new Set<string>();

    for (const booking of confirmed) {
      // Calculate nights from start_at/end_at
      if (booking.start_at && booking.end_at) {
        const start = new Date(booking.start_at);
        const end = new Date(booking.end_at);
        const nights = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        totalNights += nights;
      }

      // Extract destination name from inventory
      for (const sku of (booking.booked_skus || [])) {
        const invName = sku?.sku?.inventory?.name || sku?.sku?.name || '';
        if (invName) {
          // "Experience Spiti Valley (Winter edition)" → "Spiti Valley"
          const clean = invName
            .replace(/^Experience\s+/i, '')
            .replace(/\s*\(.*?\)\s*/g, '')
            .trim();
          if (clean) destinationSet.add(clean);
        }
      }
    }

    const result: TripStats = {
      trips: confirmed.length,
      tripNights: totalNights,
      tripDestinations: [...destinationSet].sort(),
    };

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Trip stats error:', err.message);
    return res.status(200).json(EMPTY);
  }
}
