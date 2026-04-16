import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Zo House Koramangala, Bangalore
const CENTER: [number, number] = [77.628, 12.934];

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

    map.current = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/standard',
      center: CENTER,
      zoom: 15.5,
      pitch: 62,
      bearing: -18,
      interactive: true,
      attributionControl: false,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.current.on('style.load', () => {
      if (!map.current) return;
      // Mapbox Standard style supports runtime "lightPreset" config — set to night for dark vibe
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
        map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        map.current.setConfigProperty('basemap', 'show3dObjects', true);
      } catch {
        // Older style versions may not support setConfigProperty — silently ignore
      }
    });

    map.current.on('load', () => {
      if (!map.current) return;
      // Zo House pin — pink glow
      const el = document.createElement('div');
      el.style.cssText = [
        'width: 18px',
        'height: 18px',
        'border-radius: 50%',
        'background: #FF2F8E',
        'border: 3px solid #fff',
        'box-shadow: 0 0 0 6px rgba(255,47,142,0.25), 0 0 20px rgba(255,47,142,0.8)',
        'cursor: pointer',
      ].join(';');
      new mapboxgl.Marker(el)
        .setLngLat(CENTER)
        .setPopup(
          new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
            '<div style="font-family: Rubik, sans-serif; padding: 4px 2px;"><b>BLRxZo</b><br/><small style="color:#666">Koramangala, Bangalore</small></div>'
          )
        )
        .addTo(map.current);

      // Subtle rotation animation for that "alive 3D scene" feel
      let bearing = -18;
      const rotate = setInterval(() => {
        if (!map.current) {
          clearInterval(rotate);
          return;
        }
        bearing += 0.05;
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
        className="relative w-full max-w-[420px] mx-4"
        style={{ height: '85vh', maxHeight: 760 }}
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
          className="absolute top-3 left-3 z-10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/10"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <span className="text-white text-sm font-medium">Zo World · Bangalore</span>
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
