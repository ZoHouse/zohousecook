import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Zo House Koramangala, Bangalore
const CENTER: [number, number] = [77.628, 12.934];

export interface MapWidgetProps {
  onOpen?: () => void;
}

export function MapWidget({ onOpen }: MapWidgetProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    if (!mapboxgl.accessToken) return;

    map.current = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: CENTER,
      zoom: 11,
      interactive: false,
      attributionControl: false,
    });

    const addPin = () => {
      if (!map.current) return;
      const el = document.createElement('div');
      el.style.cssText = [
        'width: 10px',
        'height: 10px',
        'border-radius: 50%',
        'background: #FF2F8E',
        'box-shadow: 0 0 0 3px rgba(255,47,142,0.35), 0 0 12px rgba(255,47,142,0.6)',
        'pointer-events: none',
      ].join(';');
      new mapboxgl.Marker(el).setLngLat(CENTER).addTo(map.current);
    };

    map.current.on('load', addPin);

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
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        background: '#1a1a1a',
      }}
    >
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      {/* Subtle gradient overlay — matches Figma wash without hiding map */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(169deg, rgba(244,242,242,0.12) 0%, rgba(142,141,141,0.18) 100%)',
          mixBlendMode: 'overlay',
        }}
        aria-hidden
      />
      {/* Tappable hint — zoom icon bottom-right */}
      {onOpen && (
        <div
          className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
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
