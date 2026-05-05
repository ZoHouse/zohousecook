/**
 * LiveLocationProvider — single source of truth for the viewer's live location.
 *
 * Why this exists at app shell level (not inside MapModal):
 *   Whereabouts is user infrastructure — the same location feeds the map,
 *   "people around me", "quests around me", future friend-proximity, nearby
 *   Zo House detection, etc. Keeping it global means one fetch, one geolocation
 *   prompt per session, and trivial sharing across surfaces.
 *
 * Layered ask strategy (see .context/zomaps-erum-asks.md):
 *   1. Onboarding → hard ask (already lives in libs/auth)
 *   2. Lobby open → silent refresh if >6h stale (handled by callers via refresh())
 *   3. Map open → silent refresh if >1h stale (handled by callers)
 *   4. Recenter button → forced refresh
 *   5. visibilitychange → silent refresh if >12h stale  (handled here)
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "react-query";
import { reverseGeocode } from "@zo/auth";
import { useWhereabouts, WhereaboutsData } from "../hooks/useWhereabouts";

interface LiveLocation {
  /** Best-known location for the viewer. null until first whereabouts read resolves. */
  location: { lat: number; long: number } | null;
  placeName: string | null;
  /** updated_at timestamp of the cached whereabouts (ISO). */
  updatedAt: string | null;
  /** True when last update is older than `staleAfterMs`. */
  isStale: boolean;
  /** True while a geolocation/geocode/post round-trip is in flight. */
  isUpdating: boolean;
  /** Last error from the refresh dance, if any. */
  error: string | null;
  /**
   * Force a fresh GPS read → reverse-geocode → POST whereabouts → revalidate
   * the cached query. Returns the new location so callers can use it
   * immediately without waiting for a re-render. Idempotent: concurrent
   * calls collapse to one request.
   */
  refresh: () => Promise<{ lat: number; long: number } | null>;
  /**
   * Refresh ONLY if the cached whereabouts is older than the given threshold.
   * Use for opportunistic background freshens (lobby mount, map open, tab focus).
   */
  refreshIfStale: (thresholdMs: number) => Promise<{ lat: number; long: number } | null>;
}

const DEFAULT_STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour
const VISIBILITY_REFRESH_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

const LiveLocationContext = createContext<LiveLocation | null>(null);

function getZoToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("zo-admin-token") ||
    localStorage.getItem("zo-web-token") ||
    null
  );
}

function getZoHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getZoToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const did =
    localStorage.getItem("zo-admin-device-id") ||
    localStorage.getItem("zo-web-device-id");
  const ds =
    localStorage.getItem("zo-admin-device-secret") ||
    localStorage.getItem("zo-web-device-secret");
  if (did) headers["client-device-id"] = did;
  if (ds) headers["client-device-secret"] = ds;
  if (process.env.APP_ID) headers["client-key"] = process.env.APP_ID;
  return headers;
}

export function LiveLocationProvider({ children }: { children: ReactNode }) {
  const { whereabouts, isLoading } = useWhereabouts();
  const queryClient = useQueryClient();

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref so concurrent refresh() calls collapse to one request.
  const inflightRef = useRef<Promise<{ lat: number; long: number } | null> | null>(null);

  const location = whereabouts?.location ?? null;
  const placeName = whereabouts?.place_name ?? null;
  const updatedAt = whereabouts?.updated_at ?? null;

  const isStale = useMemo(() => {
    if (!updatedAt) return true;
    return Date.now() - new Date(updatedAt).getTime() > DEFAULT_STALE_AFTER_MS;
  }, [updatedAt]);

  const refresh = useCallback(async (): Promise<{ lat: number; long: number } | null> => {
    if (inflightRef.current) return inflightRef.current;
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation not available");
      return null;
    }
    if (!getZoToken()) {
      setError("Not authenticated");
      return null;
    }

    setIsUpdating(true);
    setError(null);

    const promise = (async (): Promise<{ lat: number; long: number } | null> => {
      try {
        // 1) GPS fix
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 60000,
            });
          }
        );
        const { latitude: lat, longitude: long } = position.coords;

        // 2) Reverse geocode → place_name + place_id
        const geo = await reverseGeocode(lat, long);
        if (!geo) {
          setError("Couldn't identify your location");
          return null;
        }

        // 3) POST whereabouts (server-side, via the Next.js proxy so the
        //    upstream API gets the right device headers)
        const res = await fetch("/api/whereabouts", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getZoHeaders() },
          body: JSON.stringify({
            place_name: geo.place_name,
            place_ref_id: geo.place_id,
            location: { lat, long },
          }),
        });
        if (!res.ok) throw new Error(`whereabouts post ${res.status}`);

        // 4) Invalidate the read query so subscribers re-render with fresh data
        await queryClient.invalidateQueries(["my-whereabouts"]);

        return { lat, long };
      } catch (e) {
        if (typeof GeolocationPositionError !== "undefined" && e instanceof GeolocationPositionError) {
          if (e.code === e.PERMISSION_DENIED) setError("Location permission denied");
          else if (e.code === e.POSITION_UNAVAILABLE) setError("Location unavailable");
          else if (e.code === e.TIMEOUT) setError("Location request timed out");
          else setError("Geolocation error");
        } else {
          setError(e instanceof Error ? e.message : "Refresh failed");
        }
        return null;
      } finally {
        setIsUpdating(false);
        inflightRef.current = null;
      }
    })();

    inflightRef.current = promise;
    return promise;
  }, [queryClient]);

  const refreshIfStale = useCallback(
    async (thresholdMs: number): Promise<{ lat: number; long: number } | null> => {
      if (!updatedAt) {
        // No cached record at all → caller should call refresh() explicitly.
        return null;
      }
      const ageMs = Date.now() - new Date(updatedAt).getTime();
      if (ageMs > thresholdMs) return refresh();
      return null;
    },
    [updatedAt, refresh]
  );

  // Layer 5: silent refresh on tab resume if very stale (>12h).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshIfStale(VISIBILITY_REFRESH_THRESHOLD_MS).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshIfStale]);

  const value = useMemo<LiveLocation>(
    () => ({
      location,
      placeName,
      updatedAt,
      isStale,
      isUpdating: isUpdating || isLoading,
      error,
      refresh,
      refreshIfStale,
    }),
    [location, placeName, updatedAt, isStale, isUpdating, isLoading, error, refresh, refreshIfStale]
  );

  return (
    <LiveLocationContext.Provider value={value}>{children}</LiveLocationContext.Provider>
  );
}

/** Read the viewer's live location anywhere in the tree. */
export function useLiveLocation(): LiveLocation {
  const ctx = useContext(LiveLocationContext);
  if (!ctx) {
    // Fail soft: return a no-op instance so non-wrapped trees (Storybook,
    // tests) don't crash. They just never see a location.
    return {
      location: null,
      placeName: null,
      updatedAt: null,
      isStale: true,
      isUpdating: false,
      error: null,
      refresh: async () => null,
      refreshIfStale: async () => null,
    };
  }
  return ctx;
}

/** Haversine distance between two points in metres. */
export function distanceMeters(
  a: { lat: number; long: number },
  b: { lat: number; long: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.long - a.long);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Format a distance in metres for display. <1km → "850 m", else → "12.4 km". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}
