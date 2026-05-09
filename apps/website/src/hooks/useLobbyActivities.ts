import { useEffect, useMemo, useState } from 'react';
import { useQueryApi, useQueriesApi } from '@zo/auth';
import type { Media, UnifiedEventItem, ZoActivity, ZoActivitySku } from '../config';
import { distanceMeters, useLiveLocation } from '../components/LiveLocationProvider';

export interface LobbyActivityItem extends UnifiedEventItem {
  description?: string;
  shortDescription?: string;
  allMedia?: Media[];
  upcomingSkus?: ZoActivitySku[];
  bookingUrl?: string;
}

type LatLng = { lat: number; long: number };

interface ZostelOperator {
  code: string;
  name: string;
  slug?: string;
  latitude: number | string;
  longitude: number | string;
  destination?: {
    name?: string;
    slug?: string;
    code?: string;
  };
}

/** Build the public Zostel URL that opens an operator's activities panel. */
function buildZostelActivityUrl(op: ZostelOperator): string | undefined {
  if (!op.slug) return undefined;
  const dest = op.destination?.slug || op.destination?.name?.toLowerCase().replace(/\s+/g, '-');
  if (!dest) return undefined;
  return `https://www.zostel.com/destination/${dest}/stay/${op.slug}?show-activities=true`;
}

const NEAREST_OPERATOR_FANOUT = 5;
const DAYS_AHEAD = 30;
const DAY_MS = 86_400_000;

/** One-shot browser geolocation fallback when the global whereabouts cache is empty. */
function useBrowserLocation(skip: boolean): LatLng | null {
  const [coords, setCoords] = useState<LatLng | null>(null);
  useEffect(() => {
    if (skip) return;
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, long: pos.coords.longitude });
      },
      () => undefined,
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
    return () => {
      cancelled = true;
    };
  }, [skip]);
  return coords;
}

function unwrapOperators(raw: any): ZostelOperator[] {
  return raw?.data?.operators || raw?.operators || raw?.data?.results || [];
}

function unwrapActivities(raw: any): ZoActivity[] {
  return raw?.data?.results || raw?.results || [];
}

/** Combine YYYY-MM-DD date + HH:MM:SS start_time into a JS timestamp. */
function skuStartMs(sku: ZoActivitySku): number {
  const time = sku.start_time || '23:59:59';
  // Treat the date as local time — the operator's published schedule is in
  // their local clock, and the viewer is by definition near them (we picked
  // the nearest 5 operators).
  return new Date(`${sku.date}T${time}`).getTime();
}

function getNextSku(activity: ZoActivity, nowMs: number): ZoActivitySku | null {
  const futureSkus = activity.skus
    .filter((s) => skuStartMs(s) >= nowMs)
    .sort((a, b) => skuStartMs(a) - skuStartMs(b));
  return futureSkus[0] || null;
}

export interface UseLobbyActivitiesResult {
  activities: LobbyActivityItem[];
  isLoading: boolean;
  hasLocation: boolean;
}

/**
 * Closest N upcoming activities across the Zo ecosystem, scoped to the
 * viewer's location.
 *
 *   1) Fetch operators list (api.zostel.com/stay/operators/) — one request.
 *   2) Sort by haversine distance to viewer; take nearest N operators.
 *   3) Fan out per-operator activity calls to the corrected public endpoint
 *      (/api/v1/bookings/activity/operator/{pid}/inventory/) for the next
 *      30 days.
 *   4) Normalize each activity to its next future SKU, sort by start time,
 *      attach distance, slice to `limit`.
 */
export function useLobbyActivities(limit = 10): UseLobbyActivitiesResult {
  const { location: whereaboutsLocation } = useLiveLocation();
  const browserLocation = useBrowserLocation(!!whereaboutsLocation);
  const location = whereaboutsLocation ?? browserLocation;
  const hasLocation = !!location;

  // Step 1: operators list.
  const { data: operatorsRaw, isLoading: opsLoading } = useQueryApi<any>(
    'ZOSTEL_STAY_OPERATORS',
    {
      enabled: hasLocation,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 60 * 60 * 1000,
    } as any,
    '',
    '',
  );

  // Step 2: nearest N operators.
  const nearestOps = useMemo(() => {
    if (!location) return [] as { op: ZostelOperator; meters: number; lat: number; lng: number }[];
    const ops = unwrapOperators(operatorsRaw)
      .map((op) => {
        const lat = +op.latitude;
        const lng = +op.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const meters = distanceMeters(
          { lat: location.lat, long: location.long },
          { lat, long: lng },
        );
        return { op, meters, lat, lng };
      })
      .filter((x): x is { op: ZostelOperator; meters: number; lat: number; lng: number } => x !== null)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, NEAREST_OPERATOR_FANOUT);
    return ops;
  }, [operatorsRaw, location]);

  // Step 3: fan out per-operator activity calls.
  const dateRange = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + DAYS_AHEAD * DAY_MS).toISOString().split('T')[0];
    return `start_date=${today}&end_date=${end}&limit=50`;
  }, []);

  const queries = useMemo<[string, string][]>(
    () => nearestOps.map(({ op }) => [`operator/${op.code}/inventory/`, dateRange]),
    [nearestOps, dateRange],
  );

  const queryResults = useQueriesApi(
    'BOOKINGS_ACTIVITY_OPERATOR',
    { enabled: queries.length > 0 } as any,
    queries,
  );

  const isLoading =
    opsLoading || (queries.length > 0 && queryResults.some((q: any) => q.isLoading));

  // Step 4: merge, normalize, sort by start time, slice.
  const activities = useMemo<LobbyActivityItem[]>(() => {
    if (!location) return [];
    const nowMs = Date.now();
    const items: LobbyActivityItem[] = [];
    queryResults.forEach((res: any, i: number) => {
      const opMeta = nearestOps[i];
      if (!opMeta) return;
      const list = unwrapActivities(res?.data);
      list.forEach((activity) => {
        const sku = getNextSku(activity, nowMs);
        if (!sku) return;
        const upcomingSkus = activity.skus
          .filter((s) => skuStartMs(s) >= nowMs)
          .sort((a, b) => skuStartMs(a) - skuStartMs(b))
          .slice(0, 6);
        const bookingUrl = buildZostelActivityUrl(opMeta.op);
        items.push({
          id: activity.pid,
          type: 'activity',
          name: activity.name,
          date: sku.date,
          startTime: sku.start_time,
          endTime: sku.end_time,
          category: activity.category || 'activity',
          subcategory: activity.subcategory || undefined,
          price: sku.price || 0,
          latitude: opMeta.lat,
          longitude: opMeta.lng,
          location: opMeta.op.name,
          operatorName: opMeta.op.name,
          coverImage: activity.media?.[0]?.url,
          distance: opMeta.meters,
          registrationLink: bookingUrl,
          navigationLink: `https://www.google.com/maps?q=${opMeta.lat},${opMeta.lng}`,
          // Extras for the in-page detail modal.
          description: activity.description || undefined,
          shortDescription: (activity as any).short_description || undefined,
          allMedia: activity.media,
          upcomingSkus,
          bookingUrl,
        });
      });
    });
    return items
      .sort((a, b) => {
        const ad = `${a.date}T${a.startTime || '00:00:00'}`;
        const bd = `${b.date}T${b.startTime || '00:00:00'}`;
        return ad.localeCompare(bd);
      })
      .slice(0, limit);
  }, [queryResults, nearestOps, location, limit]);

  return { activities, isLoading, hasLocation };
}
