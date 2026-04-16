import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import { PROPERTIES, type PropertyKind, type ZoProperty } from './properties';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Per-kind visual treatment — taller/brighter pillars for Zo-branded, smaller for the wider Zostel chain.
const KIND_STYLE: Record<PropertyKind, { color: string; accent: string; height: number; headSize: number; label: string }> = {
  'zo-house':     { color: '#FF2F8E', accent: 'rgba(255,47,142,0.35)', height: 90, headSize: 34, label: 'Zo House' },
  'zo-club':      { color: '#BA2553', accent: 'rgba(186,37,83,0.35)',  height: 80, headSize: 30, label: 'Zo Club' },
  'zostel-plus':  { color: '#FEDD1E', accent: 'rgba(254,221,30,0.3)',  height: 64, headSize: 26, label: 'Zostel Plus' },
  'zostel-homes': { color: '#A7D921', accent: 'rgba(167,217,33,0.3)',  height: 56, headSize: 24, label: 'Zostel Homes' },
  'zostel':       { color: '#00BEA9', accent: 'rgba(0,190,169,0.3)',   height: 56, headSize: 24, label: 'Zostel' },
  'other':        { color: '#2C67F6', accent: 'rgba(44,103,246,0.3)',  height: 48, headSize: 22, label: 'Partner' },
};

function buildPillarElement(property: ZoProperty): HTMLDivElement {
  const s = KIND_STYLE[property.kind];
  const root = document.createElement('div');
  root.style.cssText = `position:relative;width:${s.headSize + 10}px;height:${s.height + s.headSize + 10}px;pointer-events:auto;cursor:pointer;font-family:Rubik,sans-serif;`;

  // Ground glow
  const ground = document.createElement('div');
  ground.style.cssText = `position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:${s.headSize + 24}px;height:12px;border-radius:50%;background:radial-gradient(ellipse at center, ${s.accent} 0%, transparent 70%);filter:blur(4px);`;

  // Vertical beam
  const beam = document.createElement('div');
  beam.style.cssText = `position:absolute;left:50%;bottom:4px;transform:translateX(-50%);width:${s.kind === 'zo-house' || s.kind === 'zo-club' ? 3 : 2}px;height:${s.height}px;background:linear-gradient(180deg, ${s.color} 0%, ${s.color}00 100%);border-radius:2px;box-shadow:0 0 10px ${s.color}, 0 0 20px ${s.accent};`;
  // Note: s.kind doesn't exist on the style object — fix: check property.kind directly
  const isZoBranded = property.kind === 'zo-house' || property.kind === 'zo-club';
  beam.style.width = `${isZoBranded ? 3 : 2}px`;

  // Pin head
  const head = document.createElement('div');
  head.style.cssText = `position:absolute;left:50%;top:0;transform:translateX(-50%);width:${s.headSize}px;height:${s.headSize}px;border-radius:50%;background:${s.color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${Math.max(8, s.headSize * 0.3)}px;font-weight:700;letter-spacing:0.02em;box-shadow:0 0 0 4px ${s.accent}, 0 6px 16px rgba(0,0,0,0.5);`;
  head.textContent = isZoBranded ? '\\z/' : '•';

  root.appendChild(ground);
  root.appendChild(beam);
  root.appendChild(head);
  return root;
}

function buildPopupHTML(property: ZoProperty): string {
  const s = KIND_STYLE[property.kind];
  return `
    <div style="font-family:Rubik,sans-serif;padding:2px;min-width:180px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:24px;height:24px;border-radius:50%;background:${s.color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0;">${property.kind === 'zo-house' || property.kind === 'zo-club' ? '\\z/' : '•'}</span>
        <div style="font-size:14px;font-weight:600;color:#111;">${property.name}</div>
      </div>
      <div style="font-size:11px;color:#666;margin-bottom:6px;">${property.destination}</div>
      <div style="font-size:10px;color:${s.color};font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">${s.label}</div>
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
    // Users navigate to other properties by tapping their pillars.
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
          // Spread in a tight spiral, ~30m per step — invisible at country zoom, distinguishable at city
          : [Math.cos(n * 2.4) * 0.0003 * n, Math.sin(n * 2.4) * 0.0003 * n];
        const coords: [number, number] = [property.lng + jitter[0], property.lat + jitter[1]];

        const el = buildPillarElement(property);
        const popup = new mapboxgl.Popup({
          offset: [0, -(KIND_STYLE[property.kind].height + 20)],
          closeButton: true,
          className: 'zo-map-popup',
          maxWidth: '260px',
        }).setHTML(buildPopupHTML(property));

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map.current!);

        // Tap/click the pillar → fly the camera in for a close-up 3D view.
        // Mapbox's default marker click still toggles the popup; this just adds motion.
        const flyToProperty = () => {
          if (!map.current) return;
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
        el.addEventListener('click', flyToProperty);
        // Improve tap-target size on touch devices without affecting visual size
        el.style.touchAction = 'manipulation';
        // Unused but useful later if we want keyboard navigation
        void marker;
      });

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

        <div
          className="absolute top-3 left-3 z-10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#FF2F8E] animate-pulse" aria-hidden />
          <span className="text-white text-sm font-medium">Zo World · {PROPERTIES.length} properties</span>
        </div>

        <div
          ref={container}
          className="w-full h-full overflow-hidden"
          style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
    </div>
  );
}
