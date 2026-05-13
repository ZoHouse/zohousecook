import { useEffect, useRef, useState } from 'react';

export interface ContinuousPosition {
  lng: number;
  lat: number;
  /**
   * Direction of travel in degrees clockwise from north (0–360). Falls back
   * to the last known value when the device reports null (e.g. citizen
   * standing still). Genuinely null only on the very first reading.
   */
  heading: number | null;
  /** Reported horizontal accuracy in metres (95% confidence). */
  accuracy: number;
  /** Speed in m/s, or null if unavailable. */
  speed: number | null;
  timestamp: number;
}

interface UseContinuousLocationResult {
  position: ContinuousPosition | null;
  error: string | null;
}

/**
 * Continuous geolocation watch — only runs while `enabled` is true. Tears
 * down `watchPosition` on disable so we don't burn battery outside nav mode.
 * Separate from LiveLocationProvider (which is refresh-on-demand, app-shell
 * scoped) — this hook is scoped to nav mode inside MapModal.
 */
export function useContinuousLocation(enabled: boolean): UseContinuousLocationResult {
  const [position, setPosition] = useState<ContinuousPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setError(null);
      lastHeadingRef.current = null;
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Heading is null when speed is 0 (standing still). Hold the last
        // known value so the camera doesn't snap to north every time the
        // citizen stops walking.
        const incomingHeading = pos.coords.heading;
        if (incomingHeading !== null && !Number.isNaN(incomingHeading)) {
          lastHeadingRef.current = incomingHeading;
        }
        setPosition({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
          heading: lastHeadingRef.current,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => {
        setError(err.message || 'Geolocation error');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}
