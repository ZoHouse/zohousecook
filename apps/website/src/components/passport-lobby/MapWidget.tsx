import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Zo House Koramangala, Bangalore
const CENTER: [number, number] = [77.628, 12.934];

export interface MapWidgetProps {
  onOpen?: () => void;
}

export function MapWidget({ onOpen }: MapWidgetProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!container.current || map.current) return;
    if (!mapboxgl.accessToken) return;

    map.current = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/standard',
      center: CENTER,
      zoom: 14.5,
      pitch: 55,
      bearing: -20,
      interactive: false,
      attributionControl: false,
      antialias: true,
    });

    map.current.on('style.load', () => {
      if (!map.current) return;
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
        map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
        map.current.setConfigProperty('basemap', 'showPlaceLabels', false);
        map.current.setConfigProperty('basemap', 'showRoadLabels', false);
        map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        map.current.setConfigProperty('basemap', 'show3dObjects', true);
      } catch {
        // Older style versions — ignore
      }
    });

    map.current.on('load', () => {
      if (!map.current) return;
      setLoaded(true);
      const el = document.createElement('div');
      el.style.cssText = [
        'width: 8px',
        'height: 8px',
        'border-radius: 50%',
        'background: #FF2F8E',
        'box-shadow: 0 0 0 3px rgba(255,47,142,0.4), 0 0 10px rgba(255,47,142,0.7)',
        'pointer-events: none',
      ].join(';');
      new mapboxgl.Marker(el).setLngLat(CENTER).addTo(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const content = (
    <div
      className="relative overflow-hidden"
      style={{
        width: 110,
        height: 74,
        borderRadius: 14,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)',
        background: '#1f2328',
      }}
    >
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      {/* Fallback shown while map loads (or if no token) */}
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[9px]"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          aria-hidden
        >
          Loading map…
        </div>
      )}
      {/* Tappable hint — expand icon bottom-right */}
      {onOpen && (
        <div
          className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          aria-hidden
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </div>
      )}
    </div>
  );

  if (!onOpen) return content;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Zo World map"
      className="block transition-transform active:scale-95 hover:brightness-110"
    >
      {content}
    </button>
  );
}
