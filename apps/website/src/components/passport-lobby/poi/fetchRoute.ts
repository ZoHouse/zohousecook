import Directions, {
  type DirectionsService,
} from '@mapbox/mapbox-sdk/services/directions';
import mapboxgl from 'mapbox-gl';

export interface RouteManeuver {
  /** e.g. 'turn', 'merge', 'arrive', 'depart', 'continue', 'roundabout'. */
  type: string;
  /** e.g. 'left', 'right', 'slight left', 'sharp right', 'straight', 'uturn'. */
  modifier?: string;
  /** Natural-language instruction, e.g. "Turn left onto Sarjapur Road". */
  instruction: string;
  /** [lng, lat] of the maneuver point. */
  location: [number, number];
  bearing_before: number;
  bearing_after: number;
}

export interface RouteStep {
  maneuver: RouteManeuver;
  /** Metres until the NEXT maneuver. */
  distance: number;
  /** Seconds until the next maneuver. */
  duration: number;
  /** Road name for this step (may be empty for unnamed segments). */
  name: string;
  geometry: GeoJSON.LineString;
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  /** Total walking duration in seconds. */
  duration: number;
  /** Total route distance in metres. */
  distance: number;
  /** Flattened step list from legs[0].steps[]. Single-leg route. */
  steps: RouteStep[];
}

let client: DirectionsService | null = null;

function getClient(): DirectionsService {
  if (!client) {
    client = Directions({ accessToken: mapboxgl.accessToken || '' });
  }
  return client;
}

export async function fetchWalkingRoute(
  from: [number, number],
  to: [number, number],
): Promise<RouteResult> {
  const response = await getClient()
    .getDirections({
      profile: 'walking',
      waypoints: [{ coordinates: from }, { coordinates: to }],
      geometries: 'geojson',
      overview: 'full',
      steps: true,
      annotations: ['duration', 'distance'],
    })
    .send();

  const route = response.body.routes[0];
  if (!route) throw new Error('No route returned');

  const geometry = route.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
  if (geometry.type !== 'LineString') {
    throw new Error(`Expected LineString geometry, got ${geometry.type}`);
  }

  // Two-waypoint walking route → exactly one leg. Flatten its steps.
  const rawSteps = route.legs?.[0]?.steps ?? [];
  const steps: RouteStep[] = rawSteps.map((s) => {
    const stepGeo = s.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
    return {
      maneuver: {
        type: s.maneuver.type,
        modifier: s.maneuver.modifier,
        instruction: s.maneuver.instruction,
        location: s.maneuver.location as [number, number],
        bearing_before: s.maneuver.bearing_before,
        bearing_after: s.maneuver.bearing_after,
      },
      distance: s.distance,
      duration: s.duration,
      name: s.name ?? '',
      geometry: stepGeo.type === 'LineString'
        ? stepGeo
        : { type: 'LineString', coordinates: stepGeo.coordinates[0] ?? [] },
    };
  });

  return {
    geometry,
    duration: route.duration,
    distance: route.distance,
    steps,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours} h ${rem} min` : `${hours} h`;
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)} km`;
}
