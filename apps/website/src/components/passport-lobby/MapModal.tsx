import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import { PROPERTIES, type PropertyKind, type ZoProperty } from './properties';

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

  const showAll = () => {
    if (!map.current) return;
    const bounds = new mapboxgl.LngLatBounds();
    PROPERTIES.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 80, right: 80 },
      pitch: 35,
      bearing: 0,
      duration: 1400,
      maxZoom: 5,
    });
    // Zooming out past the focus threshold will also clear focus via `zoomend`,
    // but fire the `zoom` event manually in case we fit within threshold.
    map.current.once('moveend', () => {
      // Brief trigger — moveend will call updateMarkerVisibility which re-evaluates focus
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

  useEffect(() => {
    if (!open || !container.current || map.current) return;
    if (!mapboxgl.accessToken) return;

    // Open zoomed-in on BLRxZo (primary property) so 3D buildings + skyline read immediately.
    // Users navigate to other properties by tapping their pillars, or "Show all" to fit the planet.
    const primary = PROPERTIES.find((p) => p.id === '9XWJCC93') ?? PROPERTIES[0];

    map.current = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [primary.lng, primary.lat],
      zoom: 16.2,
      pitch: 72,
      bearing: -18,
      interactive: true,
      attributionControl: false,
      antialias: true,
      projection: { name: 'globe' },
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.current.on('style.load', () => {
      if (!map.current) return;
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
      PROPERTIES.forEach((property) => {
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

      // Initial sync — we open zoomed in on BLRxZo, so mark it focused.
      focusedId = primary.id;
      syncMarkers();

      // Ambient slow rotate around the current center — disable once user interacts
      let bearing = -18;
      let userInteracted = false;
      const markInteracted = () => { userInteracted = true; };
      map.current.on('mousedown', markInteracted);
      map.current.on('touchstart', markInteracted);
      map.current.on('dragstart', markInteracted);

      const rotate = setInterval(() => {
        if (!map.current) {
          clearInterval(rotate);
          return;
        }
        if (userInteracted) return;
        bearing += 0.015;
        map.current.setBearing(bearing);
      }, 80);

      map.current.once('remove', () => clearInterval(rotate));
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [open]);

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

        <button
          type="button"
          onClick={showAll}
          className="absolute top-3 left-3 z-10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2 transition-all hover:bg-black/85 active:scale-95"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          aria-label="Frame all Zo properties on the map"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF2F8E] animate-pulse" aria-hidden />
          <span className="text-white text-sm font-medium">Zo World · {PROPERTIES.length} properties</span>
          <span className="text-white/50 text-xs ml-1">·&nbsp;view all</span>
        </button>

        <div
          ref={container}
          className="w-full h-full overflow-hidden"
          style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}
        />
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
        }
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-close-button:hover {
          color: #fff;
          background: transparent;
        }
        .mapboxgl-popup.zo-map-popup .mapboxgl-popup-tip {
          border-top-color: rgba(32, 32, 32, 0.9);
          border-bottom-color: rgba(52, 52, 52, 0.85);
        }
      `}</style>
    </div>
  );
}
