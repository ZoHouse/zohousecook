import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type PropertyKind, type ZoProperty } from './properties';
import { useZostelOperators, type ZostelOperator } from '../../hooks/useZostelOperators';
import { usePoiData } from './poi/usePoiData';
import { mountPoiLayers } from './poi/mountPoiLayers';
import { mountRouteLayer, type RouteLayerHandles } from './poi/mountRouteLayer';
import { fetchWalkingRoute, formatDuration, formatDistance, type RouteResult } from './poi/fetchRoute';
import { mountUserPuck, type UserPuckHandles } from './poi/mountUserPuck';
import { useContinuousLocation } from './poi/useContinuousLocation';
import { useLiveLocation, distanceMeters } from '../LiveLocationProvider';
import { NearbyPoiBar } from './NearbyPoiBar';
import { NavStepCard } from './NavStepCard';

type RouteMode = 'explore' | 'preview' | 'navigating' | 'arrived';

// Camera pitch + zoom for nav mode. Pitch 70 = aggressive game-like FPV
// where building extrusions form a canyon around the route. Zoom 18 is
// street-level — close enough that walking pace feels responsive without
// rendering being too expensive on mobile.
const NAV_PITCH = 70;
const NAV_ZOOM = 18;
// Puck stays this many pixels BELOW screen center during nav. Negative
// values would put it above. ~180px on a ~700px-tall modal lands the puck
// in the lower third, with the route extending up into the distance —
// matches Google Maps nav cam.
const NAV_PUCK_OFFSET_Y = 180;

// Zostel API `type_code` → our PropertyKind. H/B = Zostel, P = Plus, HO = Zo House, S = Zo Selections.
function kindFromTypeCode(tc?: string): PropertyKind {
  switch (tc) {
    case 'HO': return 'zo-house';
    case 'P':  return 'zostel-plus';
    case 'S':  return 'zostel-homes';
    case 'H':
    case 'B':  return 'zostel';
    default:   return 'other';
  }
}

function operatorToProperty(op: ZostelOperator): ZoProperty {
  return {
    id: op.code,
    name: op.name,
    destination: op.destination?.name ?? op.address ?? op.name,
    lat: op.latitude,
    lng: op.longitude,
    kind: kindFromTypeCode(op.type_code),
  };
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Per-kind visual treatment — compact pin-head markers that sit right on top of the building.
const KIND_STYLE: Record<PropertyKind, { color: string; accent: string; headSize: number; stem: number; label: string }> = {
  'zo-house':     { color: '#FF2F8E', accent: 'rgba(255,47,142,0.4)', headSize: 32, stem: 10, label: 'Zo House' },
  'zo-club':      { color: '#BA2553', accent: 'rgba(186,37,83,0.4)',  headSize: 28, stem: 9,  label: 'Zo Club' },
  'zostel-plus':  { color: '#FEDD1E', accent: 'rgba(254,221,30,0.35)', headSize: 24, stem: 8,  label: 'Zostel Plus' },
  'zostel-homes': { color: '#A7D921', accent: 'rgba(167,217,33,0.35)', headSize: 22, stem: 7,  label: 'Zostel Homes' },
  'zostel':       { color: '#00BEA9', accent: 'rgba(0,190,169,0.35)',  headSize: 22, stem: 7,  label: 'Zostel' },
  'other':        { color: '#2C67F6', accent: 'rgba(44,103,246,0.35)', headSize: 20, stem: 6,  label: 'Partner' },
};

/**
 * Returns { outer, inner } — Mapbox applies `transform: translate(x,y)` to the outer
 * element to position the marker at its lng/lat. We write our own `transform: scale()`
 * to the inner element so our styling never clobbers Mapbox's positioning.
 */
function buildPillarElement(property: ZoProperty): { outer: HTMLDivElement; inner: HTMLDivElement } {
  const s = KIND_STYLE[property.kind];
  const isZoBranded = property.kind === 'zo-house' || property.kind === 'zo-club';
  const totalHeight = s.headSize + s.stem + 4;

  // Outer: Mapbox-managed container. NEVER set `transform` here.
  const outer = document.createElement('div');
  outer.style.cssText = `width:${s.headSize + 12}px;height:${totalHeight}px;pointer-events:auto;cursor:pointer;`;

  // Inner: our scalable pillar content.
  const inner = document.createElement('div');
  inner.style.cssText = `position:relative;width:100%;height:100%;transform-origin:bottom center;transition:transform 120ms ease-out;font-family:Rubik,sans-serif;`;

  // Tiny ground dot (the "tip" pinned to the lat/lng)
  const tip = document.createElement('div');
  tip.style.cssText = `position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:6px;height:6px;border-radius:50%;background:${s.color};box-shadow:0 0 6px ${s.color}, 0 0 12px ${s.accent};`;

  // Short connector from tip up to pin head
  const stem = document.createElement('div');
  stem.style.cssText = `position:absolute;left:50%;bottom:4px;transform:translateX(-50%);width:${isZoBranded ? 2 : 1.5}px;height:${s.stem}px;background:linear-gradient(180deg, ${s.color} 0%, ${s.color}55 100%);`;

  // Pin head — floats just above the tip
  const head = document.createElement('div');
  head.style.cssText = `position:absolute;left:50%;top:0;transform:translateX(-50%);width:${s.headSize}px;height:${s.headSize}px;border-radius:50%;background:${s.color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${Math.max(8, s.headSize * 0.32)}px;font-weight:700;letter-spacing:0.02em;box-shadow:0 0 0 3px ${s.accent}, 0 4px 10px rgba(0,0,0,0.5);`;
  head.textContent = isZoBranded ? '\\z/' : '•';

  inner.appendChild(tip);
  inner.appendChild(stem);
  inner.appendChild(head);
  outer.appendChild(inner);
  return { outer, inner };
}

function buildPopupHTML(property: ZoProperty): string {
  const s = KIND_STYLE[property.kind];
  return `
    <div style="font-family:Rubik,sans-serif;padding:4px 8px;min-width:180px;color:#fff;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="width:28px;height:28px;border-radius:50%;background:${s.color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;box-shadow:0 0 0 3px ${s.accent};">${property.kind === 'zo-house' || property.kind === 'zo-club' ? '\\z/' : '•'}</span>
        <div style="font-size:15px;font-weight:600;color:#fff;line-height:1.2;">${property.name}</div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:8px;letter-spacing:0.01em;">${property.destination}</div>
      <div style="display:inline-block;font-size:9px;color:${s.color};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 8px;border-radius:99px;background:${s.accent};border:1px solid ${s.color}30;">${s.label}</div>
    </div>
  `;
}

export interface MapModalProps {
  open: boolean;
  onClose: () => void;
}

export function MapModal({ open, onClose }: MapModalProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'no-token' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready' }
  >({ kind: 'idle' });

  const { operators } = useZostelOperators(open);
  const properties = useMemo<ZoProperty[]>(
    () => (operators ? operators.map(operatorToProperty) : []),
    [operators],
  );
  const { data: poiData } = usePoiData(open);
  const poiUnmount = useRef<(() => void) | null>(null);
  const showPoiRef = useRef<((lng: number, lat: number, props: GeoJSON.GeoJsonProperties, mode?: 'fly' | 'soft') => void) | null>(null);
  const closePoiPopupRef = useRef<(() => void) | null>(null);

  // Route state — set when a citizen taps "Walk here" on a POI popup. `data`
  // is null while the Directions request is in flight; populated when it
  // resolves. Cleared on basemap tap or modal close. Layer handles live in a
  // ref so the popup click callback can call drawRoute without re-rendering.
  const [route, setRoute] = useState<{
    from: [number, number];
    to: [number, number];
    poiId: string;
    data: RouteResult | null;
    error: string | null;
  } | null>(null);
  const routeLayerRef = useRef<RouteLayerHandles | null>(null);

  // Nav-mode FSM. Transitions:
  //   explore → preview      when fetchWalkingRoute resolves
  //   preview → navigating   when citizen taps Start
  //   navigating → arrived   when within 30 m of final destination
  //   any → explore          on End / Close / basemap tap (preview only)
  const [routeMode, setRouteMode] = useState<RouteMode>('explore');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const userPuckRef = useRef<UserPuckHandles | null>(null);
  // `prevProjection` lets us swap back to whatever the citizen had (globe)
  // when nav ends.
  const prevProjectionRef = useRef<mapboxgl.Projection | null>(null);

  // Continuous geolocation — only runs while navigating. Bills no battery
  // in explore / preview / arrived modes.
  const { position: navPosition } = useContinuousLocation(routeMode === 'navigating');
  const navPositionRef = useRef(navPosition);
  useEffect(() => {
    navPositionRef.current = navPosition;
  }, [navPosition]);

  // Every Map button click is treated as explicit "show me where I am" intent →
  // force a fresh GPS read + whereabouts POST. refresh() dedupes via inflight
  // ref, so rapid re-opens collapse to a single request.
  const { location: liveLocation, refresh: refreshLocation, isUpdating: locationUpdating } =
    useLiveLocation();
  useEffect(() => {
    if (open) refreshLocation().catch(() => undefined);
  }, [open, refreshLocation]);

  // Latest viewer location, refreshed on every render. POI popup callbacks
  // read through this ref so they never close over stale data.
  const liveLocationRef = useRef(liveLocation);
  useEffect(() => { liveLocationRef.current = liveLocation; }, [liveLocation]);

  // If whereabouts arrives AFTER the map was already created (we'd have
  // fallen back to BLRxZo), gently fly the camera to the user's real location
  // once it lands. Runs once per modal open.
  const hasFlownToLiveOnce = useRef(false);
  useEffect(() => {
    if (!open) { hasFlownToLiveOnce.current = false; return; }
    if (!map.current || !liveLocation || hasFlownToLiveOnce.current) return;
    hasFlownToLiveOnce.current = true;
    map.current.flyTo({
      center: [liveLocation.long, liveLocation.lat],
      zoom: Math.max(map.current.getZoom(), 16.5),  // 3D-buildings-friendly
      pitch: 62,
      bearing: map.current.getBearing(),
      duration: 1600,
      curve: 1.4,
      speed: 0.7,
      essential: true,
    });
  }, [open, liveLocation]);

// Recenter button: force a fresh GPS fix, fly there. Honors user intent
  // ("where am I right now") even if cached whereabouts is fresh. Falls back
  // to the cached liveLocation if the live refresh fails (e.g. permission
  // denied) — at least flies to the last known location instead of nothing.
  const handleRecenter = async () => {
    const fresh = await refreshLocation();
    const target = fresh ?? liveLocation;
    if (!map.current || !target) return;
    map.current.flyTo({
      center: [target.long, target.lat],
      zoom: Math.max(map.current.getZoom(), 16.5),
      pitch: 72,
      bearing: map.current.getBearing(),
      speed: 1.2,
      curve: 1.5,
      essential: true,
    });
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Clear route state + nav mode when modal closes — otherwise a re-open
  // flashes the stale pill / step card before the map is even ready.
  useEffect(() => {
    if (!open) {
      setRoute(null);
      setRouteMode('explore');
      setActiveStepIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!mapboxgl.accessToken) {
      setStatus({ kind: 'no-token' });
      return;
    }
    if (properties.length === 0) {
      setStatus({ kind: 'loading' });
      return;
    }
    if (!container.current || map.current) return;
    setStatus({ kind: 'loading' });

    // Default center: viewer's live location (Erum's ask #4). Falls back to
    // BLRxZo only if no whereabouts is loaded yet — and the camera will
    // gently fly to the user's location once it arrives (handled by the
    // liveLocation effect below).
    const primary = properties.find((p) => p.id === 'BNGHO812') ?? properties[0];
    const initialCenter: [number, number] = liveLocation
      ? [liveLocation.long, liveLocation.lat]
      : [primary.lng, primary.lat];

    map.current = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/standard',
      center: initialCenter,
      zoom: 16.5,        // close enough for Standard-style 3D buildings to render
      pitch: 72,
      bearing: -18,
      interactive: true,
      attributionControl: false,
      antialias: true,
      projection: { name: 'globe' },
    });

    // Zoom/compass control top-left — clears the entire bottom for the carousel.
    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');

    map.current.on('style.load', () => {
      if (!map.current) return;
      setStatus({ kind: 'ready' });
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
        map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
        map.current.setConfigProperty('basemap', 'showPlaceLabels', true);
        map.current.setConfigProperty('basemap', 'showRoadLabels', false);
        map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        map.current.setConfigProperty('basemap', 'show3dObjects', true);
      } catch {
        // Older style versions — ignore
      }
    });

    map.current.on('error', (e) => {
      // Surface any Mapbox runtime error (bad token, style 404, tile fetch fail)
      // so the modal doesn't sit dark and silent.
      const message = (e.error && (e.error.message || String(e.error))) || 'Mapbox error';
      console.error('[MapModal] mapbox error:', e);
      setStatus({ kind: 'error', message });
    });

    // Track all markers so we can hide all-but-focused when zoomed in close.
    // Threshold: zoom ≥ HIDE_OTHERS_ZOOM → only the focused property's marker is visible.
    const markerEntries: Array<{ id: string; outer: HTMLDivElement; inner: HTMLDivElement; marker: mapboxgl.Marker }> = [];
    let focusedId: string | null = null;
    const HIDE_OTHERS_ZOOM = 14;

    const syncMarkers = () => {
      if (!map.current) return;
      const zoom = map.current.getZoom();

      // Scale pin contents (NOT the outer Mapbox-managed div)
      // Ramp 0.32 at zoom 2 → 1.0 at zoom 14
      const scale = Math.max(0.32, Math.min(1, 0.32 + (zoom - 2) * 0.057));

      // At low zoom (<8), collapse duplicate city-centroid pins to one per 0.1° cell
      const suppressClusters = zoom < 8;
      const seenCell = new Set<string>();

      const hideOthers = zoom >= HIDE_OTHERS_ZOOM && focusedId !== null;

      for (const entry of markerEntries) {
        entry.inner.style.transform = `scale(${scale})`;

        let clusterHidden = false;
        if (suppressClusters) {
          const ll = entry.marker.getLngLat();
          const cell = `${ll.lat.toFixed(1)},${ll.lng.toFixed(1)}`;
          if (seenCell.has(cell)) clusterHidden = true;
          else seenCell.add(cell);
        }

        const focusHidden = hideOthers && entry.id !== focusedId;
        entry.outer.style.display = clusterHidden || focusHidden ? 'none' : '';
      }
    };

    map.current.on('load', () => {
      if (!map.current) return;

      // Jitter properties that share exact coords (city centroids) so pins don't stack
      const seen = new Map<string, number>();
      properties.forEach((property) => {
        const key = `${property.lat.toFixed(4)},${property.lng.toFixed(4)}`;
        const n = seen.get(key) ?? 0;
        seen.set(key, n + 1);

        const jitter = n === 0
          ? [0, 0]
          // Tight spiral, ~10m radius increments — imperceptible at country zoom,
          // distinguishable once you zoom past the city level.
          : [Math.cos(n * 2.4) * 0.0001 * (1 + n * 0.3), Math.sin(n * 2.4) * 0.0001 * (1 + n * 0.3)];
        const coords: [number, number] = [property.lng + jitter[0], property.lat + jitter[1]];

        const { outer, inner } = buildPillarElement(property);
        const ks = KIND_STYLE[property.kind];
        const popup = new mapboxgl.Popup({
          offset: [0, -(ks.headSize + ks.stem + 8)],
          closeButton: true,
          className: 'zo-map-popup',
          maxWidth: '260px',
        }).setHTML(buildPopupHTML(property));

        const marker = new mapboxgl.Marker({ element: outer, anchor: 'bottom' })
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map.current!);

        markerEntries.push({ id: property.id, outer, inner, marker });

        // Tap/click the pillar → fly the camera in for a close-up 3D view.
        const flyToProperty = () => {
          if (!map.current) return;
          focusedId = property.id;
          map.current.flyTo({
            center: coords,
            zoom: 16,
            pitch: 62,
            bearing: map.current.getBearing(),
            speed: 1.4,
            curve: 1.6,
            essential: true,
          });
        };
        outer.addEventListener('click', flyToProperty);
        outer.style.touchAction = 'manipulation';
      });

      // If user pans/zooms away from focus, clear focus so all markers return
      const clearFocusIfAway = () => {
        if (!map.current || !focusedId) return;
        if (map.current.getZoom() < HIDE_OTHERS_ZOOM - 1) {
          focusedId = null;
        }
      };

      map.current.on('zoom', syncMarkers);
      map.current.on('zoomend', () => {
        clearFocusIfAway();
        syncMarkers();
      });
      map.current.on('moveend', syncMarkers);

      // Don't auto-focus any property on open — that hides all other Zo
      // Houses at high zoom (the WhiteField pillar would vanish when opening
      // centered on BLR). Focus only kicks in when the user explicitly clicks
      // a pillar, then returns to "show all" once they pan away.
      syncMarkers();

      // Ambient slow rotate around the current center — disable once user
      // interacts. CRITICAL: setBearing() is an instant camera op that CANCELS
      // any in-flight flyTo/easeTo. So this rotation MUST also bail while the
      // map is currently animating, otherwise it kills our carousel flyTo every
      // 80ms (the carousel arrow click doesn't fire mousedown/touchstart on
      // the map canvas, so the original userInteracted guard wouldn't catch it).
      let bearing = -18;
      let userInteracted = false;
      const markInteracted = () => { userInteracted = true; };
      map.current.on('mousedown', markInteracted);
      map.current.on('touchstart', markInteracted);
      map.current.on('dragstart', markInteracted);
      // Any programmatic camera move (e.g. carousel flyTo, recenter) also
      // counts — once we've moved the camera, ambient rotation has done its
      // job and shouldn't fight subsequent navigation.
      map.current.on('movestart', (e) => {
        // originalEvent absent → programmatic move; we still want to kill rotation
        // because the user has clearly engaged with the map.
        if (!e.originalEvent) markInteracted();
      });

      const rotate = setInterval(() => {
        if (!map.current) {
          clearInterval(rotate);
          return;
        }
        if (userInteracted) return;
        // Defensive: never tick while an animation is running, otherwise
        // setBearing cancels it.
        if (map.current.isMoving() || map.current.isEasing()) return;
        bearing += 0.015;
        map.current.setBearing(bearing);
      }, 80);

      map.current.once('remove', () => clearInterval(rotate));
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [open, properties.length]);

  // Mount POI overlay once both the map style is loaded AND the GeoJSON has
  // arrived. Property pins (HTML markers) and POIs (Mapbox source+layer)
  // coexist; layer mount is independent of marker creation. The route layer
  // mounts in the same effect so it slots cleanly UNDER the POI symbol
  // layer (mountRouteLayer uses `pois-symbol` as beforeId).
  useEffect(() => {
    if (status.kind !== 'ready') return;
    if (!poiData) return;
    if (!map.current) return;

    const handleWalkHereRequested = (
      from: [number, number],
      to: [number, number],
      poiId: string,
    ) => {
      setRoute({ from, to, poiId, data: null, error: null });
      setRouteMode('preview');
      setActiveStepIndex(0);
      fetchWalkingRoute(from, to)
        .then((result) => {
          setRoute((prev) =>
            prev && prev.poiId === poiId ? { ...prev, data: result } : prev,
          );
          routeLayerRef.current?.drawRoute(result.geometry);
          // Reframe the camera to fit the whole route. Without this the user
          // is still parked on the destination POI from the prior flyTo, so
          // they never see where the route starts.
          if (map.current && result.geometry.coordinates.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            for (const [lng, lat] of result.geometry.coordinates) {
              bounds.extend([lng, lat]);
            }
            map.current.fitBounds(bounds, {
              padding: { top: 80, bottom: 200, left: 60, right: 60 },
              pitch: 50,
              bearing: map.current.getBearing(),
              duration: 1400,
              essential: true,
            });
          }
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Route lookup failed';
          console.error('[MapModal] fetchWalkingRoute failed:', err);
          setRoute((prev) =>
            prev && prev.poiId === poiId ? { ...prev, error: message } : prev,
          );
        });
    };

    const layers = mountPoiLayers(
      map.current,
      poiData,
      () => liveLocationRef.current,
      handleWalkHereRequested,
    );
    const routeLayer = mountRouteLayer(map.current);
    poiUnmount.current = layers.unmount;
    showPoiRef.current = layers.showPoi;
    closePoiPopupRef.current = layers.closePopup;
    routeLayerRef.current = routeLayer;
    return () => {
      poiUnmount.current?.();
      poiUnmount.current = null;
      showPoiRef.current = null;
      closePoiPopupRef.current = null;
      routeLayer.unmount();
      routeLayerRef.current = null;
    };
  }, [status.kind, poiData]);

  // Tap basemap (anywhere not on a POI / property pin) → clear route.
  // Only honored in preview mode; we don't want an accidental basemap tap
  // to kill an in-progress navigation. Read mode via ref so the handler
  // doesn't need to be re-registered every time mode flips.
  const routeModeRef = useRef(routeMode);
  useEffect(() => {
    routeModeRef.current = routeMode;
  }, [routeMode]);
  useEffect(() => {
    if (!map.current) return;
    const handleBasemapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current) return;
      // POI taps fire their own layer-scoped handler; skip basemap clearing
      // if the click landed on a POI hit-area.
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['pois-hitarea'],
      });
      if (features.length > 0) return;
      if (routeModeRef.current !== 'preview') return;
      setRoute(null);
      setRouteMode('explore');
      routeLayerRef.current?.clear();
    };
    map.current.on('click', handleBasemapClick);
    return () => {
      map.current?.off('click', handleBasemapClick);
    };
  }, [status.kind]);

  // Defensive: any POI popup still open when nav starts gets force-closed.
  // The mountPoiLayers Walk-Here delegate already calls popup.remove() at
  // click time, but if a popup was opened via the carousel onSelect or
  // marker click between Walk-Here and Start, we'd otherwise inherit it.
  useEffect(() => {
    if (routeMode === 'navigating') {
      closePoiPopupRef.current?.();
    }
  }, [routeMode]);

  // Nav lifecycle — mount the user puck and swap projection to mercator
  // when entering nav (also kept during 'arrived' so the puck stays put on
  // the destination). Tear down + restore projection on exit. 'navigating'
  // → 'arrived' is intentionally NOT a re-mount because `isNavActive`
  // doesn't change across that transition.
  const isNavActive = routeMode === 'navigating' || routeMode === 'arrived';
  useEffect(() => {
    if (!isNavActive) return;
    if (status.kind !== 'ready') return;
    if (!map.current) return;

    const puck = mountUserPuck(map.current);
    userPuckRef.current = puck;

    try {
      prevProjectionRef.current = map.current.getProjection();
      map.current.setProjection({ name: 'mercator' });
    } catch (err) {
      console.warn('[MapModal] setProjection mercator failed:', err);
    }

    return () => {
      puck.unmount();
      userPuckRef.current = null;
      if (map.current && prevProjectionRef.current) {
        try {
          map.current.setProjection(prevProjectionRef.current);
        } catch (err) {
          console.warn('[MapModal] setProjection restore failed:', err);
        }
        prevProjectionRef.current = null;
      }
    };
  }, [isNavActive, status.kind]);

  // Position-update handler — fires on every watchPosition tick while
  // routeMode === 'navigating'. Drives the puck, the camera, step
  // advancement, and arrival detection. Skips when in 'arrived' so the
  // camera stops following once we've arrived.
  useEffect(() => {
    if (routeMode !== 'navigating') return;
    if (!navPosition) return;
    if (!map.current || !route?.data) return;

    // Bearing source: prefer real direction of travel from watchPosition.
    // If unavailable (stationary, or desktop without GPS), fall back to the
    // current step's `bearing_after` — Mapbox's "you should be facing this
    // way along this step". Critical for desktop testing AND for the very
    // first navPosition tick before any walking has happened — otherwise
    // the camera inherits whatever bearing the preview fitBounds left and
    // the route extends in a random direction.
    const stepBearing = route.data.steps[activeStepIndex]?.maneuver.bearing_after;
    const fallbackBearing = stepBearing ?? map.current.getBearing();
    const bearing = navPosition.heading ?? fallbackBearing;

    // 1) Move the puck. Apply the same bearing fallback so the puck arrow
    //    points along the step direction when real heading is unknown,
    //    matching the camera orientation.
    userPuckRef.current?.setPosition(navPosition.lng, navPosition.lat, bearing);

    // 2) Camera follow — center on the citizen's actual position, then push
    //    them down via screen-pixel `offset` so they sit in the lower third
    //    of the modal. The route extends UP the screen into the distance.
    //    easeTo cancels any in-flight ease, so we don't need to guard
    //    against overlap.
    map.current.easeTo({
      center: [navPosition.lng, navPosition.lat],
      offset: [0, NAV_PUCK_OFFSET_Y],
      bearing,
      pitch: NAV_PITCH,
      zoom: NAV_ZOOM,
      duration: 800,
      essential: true,
    });

    // 3) Step advancement — when within 25m of the NEXT maneuver point,
    //    advance the active step. Mapbox 'step' i ends at maneuver[i+1].
    const steps = route.data.steps;
    if (activeStepIndex < steps.length - 1) {
      const nextStep = steps[activeStepIndex + 1];
      const [mLng, mLat] = nextStep.maneuver.location;
      const dToNext = distanceMeters(
        { lat: navPosition.lat, long: navPosition.lng },
        { lat: mLat, long: mLng },
      );
      if (dToNext < 25) {
        setActiveStepIndex(activeStepIndex + 1);
      }
    }

    // 4) Arrival — within 30m of the destination POI, switch to arrived.
    const [destLng, destLat] = route.to;
    const dToDest = distanceMeters(
      { lat: navPosition.lat, long: navPosition.lng },
      { lat: destLat, long: destLng },
    );
    if (dToDest < 30) {
      setRouteMode('arrived');
    }
  }, [navPosition, routeMode, route, activeStepIndex]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zo World map"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] md:max-w-[min(90vw,1280px)] mx-4 md:mx-8"
        style={{ height: '85vh', maxHeight: 900 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close map"
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-black/90 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Recenter to my live location (Erum's ask #5) */}
        <button
          type="button"
          onClick={handleRecenter}
          disabled={locationUpdating}
          aria-label="Recenter on my location"
          className="absolute top-16 right-3 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-black/90 transition disabled:opacity-60"
        >
          {locationUpdating ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.2-8.55" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
          )}
        </button>


        <div
          ref={container}
          className="w-full h-full overflow-hidden relative"
          style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a' }}
        >
          {(status.kind === 'no-token' ||
            status.kind === 'loading' ||
            status.kind === 'error') && (
            <div className="absolute inset-0 flex items-center justify-center text-center px-8 pointer-events-none">
              <div className="text-white/80 text-sm">
                {status.kind === 'no-token' && (
                  <>
                    <div className="font-semibold mb-1">Map unavailable</div>
                    <div className="text-xs text-white/50">
                      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is not set in the env for
                      this deploy.
                    </div>
                  </>
                )}
                {status.kind === 'loading' && (
                  <div className="text-xs text-white/50">
                    {properties.length === 0
                      ? 'Loading properties…'
                      : 'Loading map…'}
                  </div>
                )}
                {status.kind === 'error' && (
                  <>
                    <div className="font-semibold mb-1">Map failed to load</div>
                    <div className="text-xs text-white/50 max-w-[320px] mx-auto">
                      {status.message}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bottom carousel: nearest POIs sorted by distance from viewer.
              Tap or arrow → flyTo + opens popup via the showPoi callback we
              captured from mountPoiLayers. Hidden during navigating /
              arrived — picking another POI mid-walk is redundant noise. */}
          {status.kind === 'ready' && poiData && !isNavActive && (
            <NearbyPoiBar
              geojson={poiData}
              viewer={liveLocation}
              onSelect={(lng, lat, props, mode) => {
                showPoiRef.current?.(lng, lat, props, mode);
              }}
            />
          )}

          {/* Preview pill — top-center. Shows duration + distance plus a
              Start CTA that flips to nav mode. Hidden while navigating
              (NavStepCard takes over) and during arrived (Arrived pill
              below replaces it). */}
          {route && routeMode === 'preview' && (
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md text-white text-xs"
                style={{ background: 'rgba(0,0,0,0.7)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 5l7 7-7 7M5 12h15" />
                </svg>
                <span className="font-medium tracking-wide whitespace-nowrap">
                  {route.error
                    ? route.error
                    : route.data
                      ? `${formatDuration(route.data.duration)} · ${formatDistance(route.data.distance)}`
                      : 'Finding route…'}
                </span>
                {route.data && (
                  <button
                    type="button"
                    onClick={() => {
                      setRouteMode('navigating');
                      setActiveStepIndex(0);
                    }}
                    className="ml-1 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]"
                    style={{
                      background: '#00B4FF',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(0,180,255,0.35)',
                    }}
                  >
                    Start
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Clear route"
                  onClick={() => {
                    setRoute(null);
                    setRouteMode('explore');
                    routeLayerRef.current?.clear();
                  }}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Navigating — NavStepCard at top. Live distance counts down off
              the watchPosition stream via navPosition. */}
          {route?.data && routeMode === 'navigating' && (() => {
            const steps = route.data.steps;
            const idx = Math.min(activeStepIndex, steps.length - 1);
            const currentStep = steps[idx];
            const isLastStep = idx >= steps.length - 1;
            const nextTarget = isLastStep
              ? route.to
              : steps[idx + 1].maneuver.location;
            const distanceToNext = navPosition
              ? distanceMeters(
                  { lat: navPosition.lat, long: navPosition.lng },
                  { lat: nextTarget[1], long: nextTarget[0] },
                )
              : currentStep.distance;
            const remaining = steps.slice(idx);
            const totalRemainingDuration = remaining.reduce((s, st) => s + st.duration, 0);
            const totalRemainingDistance = remaining.reduce((s, st) => s + st.distance, 0);
            return (
              <NavStepCard
                step={currentStep}
                distanceToNext={distanceToNext}
                totalRemainingDuration={totalRemainingDuration}
                totalRemainingDistance={totalRemainingDistance}
                onEnd={() => {
                  setRoute(null);
                  setRouteMode('explore');
                  setActiveStepIndex(0);
                  routeLayerRef.current?.clear();
                }}
              />
            );
          })()}

          {/* Arrived — celebratory pill with Complete CTA. Until quest
              completion is wired through to the parent / Django, Complete
              just clears state. */}
          {route && routeMode === 'arrived' && (
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md text-white text-xs"
                style={{ background: 'rgba(0,0,0,0.78)' }}
              >
                <span className="text-base">🎉</span>
                <span className="font-semibold tracking-wide whitespace-nowrap">You&apos;ve arrived</span>
                <button
                  type="button"
                  onClick={() => {
                    setRoute(null);
                    setRouteMode('explore');
                    setActiveStepIndex(0);
                    routeLayerRef.current?.clear();
                  }}
                  className="ml-1 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]"
                  style={{
                    background: '#00B4FF',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,180,255,0.35)',
                  }}
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Glass-style Mapbox popup — matches TravelersPill treatment */
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-content {
          padding: 12px 14px;
          border-radius: 16px;
          background: linear-gradient(
            157deg,
            rgba(52, 52, 52, 0.85) 3%,
            rgba(66, 65, 65, 0.85) 14%,
            rgba(32, 32, 32, 0.9) 52%,
            rgba(48, 48, 48, 0.85) 100%
          );
          border: 1.5px solid transparent;
          background-clip: padding-box;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: #fff;
        }
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-close-button {
          color: rgba(255, 255, 255, 0.55);
          font-size: 20px;
          padding: 4px 8px;
          right: 2px;
          top: 2px;
          border: none;
          outline: none;
          box-shadow: none;
          background: transparent;
        }
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-close-button:hover,
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-close-button:focus,
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-close-button:focus-visible,
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-close-button:active {
          color: #fff;
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
        }
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-tip {
          border-top-color: rgba(32, 32, 32, 0.9);
          border-bottom-color: rgba(52, 52, 52, 0.85);
        }
      `}</style>
    </div>
  );
}
