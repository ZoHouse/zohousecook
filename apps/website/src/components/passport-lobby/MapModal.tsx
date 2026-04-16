import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

type PropertyKind = 'zo-house' | 'zostel' | 'zo-cafe';

interface ZoProperty {
  id: string;
  name: string;
  subtitle: string;
  kind: PropertyKind;
  coords: [number, number]; // [lng, lat]
  color: string;
  accent: string;
}

// Zo ecosystem properties — extend this list as we plot more.
const PROPERTIES: ZoProperty[] = [
  {
    id: 'blrxzo',
    name: 'BLRxZo',
    subtitle: 'Koramangala · Bangalore',
    kind: 'zo-house',
    coords: [77.628, 12.934],
    color: '#FF2F8E',
    accent: 'rgba(255,47,142,0.35)',
  },
  {
    id: 'wtfxzo',
    name: 'WTFxZo',
    subtitle: 'Whitefield · Bangalore',
    kind: 'zo-house',
    coords: [77.7481, 12.9716],
    color: '#A7D921',
    accent: 'rgba(167,217,33,0.35)',
  },
];

function buildPillarElement(property: ZoProperty): HTMLDivElement {
  const root = document.createElement('div');
  root.style.cssText = 'position:relative;width:44px;height:120px;pointer-events:auto;cursor:pointer;font-family:Rubik,sans-serif;';

  root.innerHTML = `
    <!-- Ground glow (ellipse at base) -->
    <div style="
      position:absolute;left:50%;bottom:0;transform:translateX(-50%);
      width:64px;height:16px;border-radius:50%;
      background:radial-gradient(ellipse at center, ${property.accent} 0%, transparent 70%);
      filter:blur(4px);
    "></div>

    <!-- Pillar body (vertical beam rising from ground) -->
    <div style="
      position:absolute;left:50%;bottom:4px;transform:translateX(-50%);
      width:4px;height:84px;
      background:linear-gradient(180deg, ${property.color} 0%, ${property.color}00 100%);
      border-radius:2px;
      box-shadow:0 0 14px ${property.color}, 0 0 28px ${property.accent};
    "></div>

    <!-- Pin head (circular badge at the top) -->
    <div style="
      position:absolute;left:50%;top:0;transform:translateX(-50%);
      width:36px;height:36px;border-radius:50%;
      background:${property.color};
      border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:10px;font-weight:700;letter-spacing:0.02em;
      box-shadow:0 0 0 6px ${property.accent}, 0 8px 20px rgba(0,0,0,0.55);
      animation:pulse-${property.id} 2.4s ease-in-out infinite;
    ">
      ${property.kind === 'zo-house' ? '\\z/' : '•'}
    </div>

    <style>
      @keyframes pulse-${property.id} {
        0%, 100% { box-shadow:0 0 0 6px ${property.accent}, 0 8px 20px rgba(0,0,0,0.55); }
        50%      { box-shadow:0 0 0 12px ${property.accent.replace(/,[\s\d.]+\)$/, ',0.15)')}, 0 8px 20px rgba(0,0,0,0.55); }
      }
    </style>
  `;

  return root;
}

function buildPopupHTML(property: ZoProperty): string {
  return `
    <div style="font-family:Rubik,sans-serif;padding:2px;min-width:180px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="
          width:24px;height:24px;border-radius:50%;
          background:${property.color};
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:9px;font-weight:700;flex-shrink:0;
        ">\\z/</span>
        <div style="font-size:14px;font-weight:600;color:#111;">${property.name}</div>
      </div>
      <div style="font-size:11px;color:#666;margin-bottom:6px;">${property.subtitle}</div>
      <div style="font-size:10px;color:${property.color};font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">
        ${property.kind === 'zo-house' ? 'Zo House' : property.kind === 'zostel' ? 'Zostel' : 'Zo Cafe'}
      </div>
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

    // Compute bounds that frame all properties
    const bounds = new mapboxgl.LngLatBounds();
    PROPERTIES.forEach((p) => bounds.extend(p.coords));

    map.current = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/standard',
      bounds,
      fitBoundsOptions: { padding: 120, pitch: 55, bearing: -15, maxZoom: 14 },
      interactive: true,
      attributionControl: false,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.current.on('style.load', () => {
      if (!map.current) return;
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
        map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        map.current.setConfigProperty('basemap', 'show3dObjects', true);
      } catch {
        // Older style versions — ignore
      }
    });

    map.current.on('load', () => {
      if (!map.current) return;

      PROPERTIES.forEach((property) => {
        const el = buildPillarElement(property);
        const popup = new mapboxgl.Popup({
          offset: [0, -100],
          closeButton: true,
          className: 'zo-map-popup',
          maxWidth: '260px',
        }).setHTML(buildPopupHTML(property));

        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(property.coords)
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Slow auto-rotate for ambient motion
      let bearing = -15;
      const rotate = setInterval(() => {
        if (!map.current) {
          clearInterval(rotate);
          return;
        }
        bearing += 0.04;
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
        {/* Close button */}
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

        {/* Title card */}
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
