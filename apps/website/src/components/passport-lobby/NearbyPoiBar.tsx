/**
 * NearbyPoiBar — bottom-of-map carousel of POIs nearest to the viewer.
 *
 * Why: marker tapping is precision work. A persistent bar lets the user
 * swipe / arrow through a curated stack of nearby Quests like a gallery,
 * with each card showing hero pic + name + culture chip + distance. Tapping
 * a card flies the camera in and opens the POI's popup.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { distanceMeters, formatDistance } from "../LiveLocationProvider";

interface PoiFeature {
  id: string;
  name: string;
  description: string | null;
  destination: string | null;
  country: string | null;
  culture_key: string;
  hero_picture: string | null;
  lng: number;
  lat: number;
}

const CULTURE_ICON_BASE = "https://cdn.zo.xyz/profile/culture";
const CULTURE_ICON_QUERY = "?w=128";
const MAX_NEARBY = 25;

function cultureLabel(key: string): string {
  return key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface NearbyPoiBarProps {
  geojson: GeoJSON.FeatureCollection | null;
  viewer: { lat: number; long: number } | null;
  /**
   * Called when the active card changes.
   *  - mode 'soft' for arrow/keyboard browsing (smooth ease, preserves zoom)
   *  - mode 'fly'  for an explicit card tap (hard fly-in, zoom 16+, pitch up)
   */
  onSelect: (
    lng: number, lat: number,
    properties: GeoJSON.GeoJsonProperties,
    mode: 'fly' | 'soft',
  ) => void;
}

export function NearbyPoiBar({ geojson, viewer, onSelect }: NearbyPoiBarProps) {
  const [index, setIndex] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  // Swipe-gesture bookkeeping. We track start x/y to distinguish horizontal
  // swipes from vertical scrolls, and a "this was a swipe, not a tap" flag so
  // the card's onClick (fly-in) doesn't fire when the citizen swipes.
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const didSwipe = useRef(false);
  const SWIPE_THRESHOLD = 50;
  const HORIZONTAL_BIAS = 1.2;

  // Sort POIs by distance from viewer; keep top N.
  const nearby = useMemo<PoiFeature[]>(() => {
    if (!geojson || !viewer) return [];
    const ranked: Array<PoiFeature & { d: number }> = [];
    for (const f of geojson.features) {
      if (f.geometry?.type !== "Point") continue;
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
      const props = f.properties || {};
      const d = distanceMeters(
        { lat: viewer.lat, long: viewer.long },
        { lat, long: lng },
      );
      ranked.push({
        id: String(props.id || `${lng},${lat}`),
        name: String(props.name || "Unnamed"),
        description: (props.description as string | null) ?? null,
        destination: (props.destination as string | null) ?? null,
        country: (props.country as string | null) ?? null,
        culture_key: String(props.culture_key || "follow-your-heart"),
        hero_picture: (props.hero_picture as string | null) ?? null,
        lng, lat, d,
      });
    }
    ranked.sort((a, b) => a.d - b.d);
    return ranked.slice(0, MAX_NEARBY);
  }, [geojson, viewer]);

  // Reset to first card whenever the input set changes.
  useEffect(() => {
    setIndex(0);
  }, [nearby.length]);

  // Notify parent whenever index changes — soft pan keeps the carousel
  // browsing experience smooth (no force-zoom, no pitch jolt).
  useEffect(() => {
    if (!nearby[index]) return;
    const p = nearby[index];
    onSelect(
      p.lng, p.lat,
      {
        id: p.id, name: p.name, description: p.description,
        destination: p.destination, country: p.country,
        culture_key: p.culture_key, hero_picture: p.hero_picture,
      },
      'soft',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, nearby]);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!nearby.length) return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(nearby.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nearby.length]);

  if (!viewer || nearby.length === 0) return null;
  const poi = nearby[index];
  const distLabel = formatDistance(
    distanceMeters({ lat: viewer.lat, long: viewer.long }, { lat: poi.lat, long: poi.lng }),
  );
  const locLine = [poi.destination, poi.country].filter(Boolean).join(", ");

  return (
    <div
      // Bottom is fully clear now (zoom controls moved to top-left); span
      // the full width for maximum readable card.
      className="absolute left-3 right-3 bottom-3 z-10 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-2xl border border-white/10 backdrop-blur-md flex items-stretch gap-3 p-3 cursor-pointer transition-transform active:scale-[0.99]"
        style={{
          background: "rgba(0,0,0,0.7)",
          transform: dragDx ? `translateX(${dragDx}px)` : undefined,
          transition: dragDx ? "none" : "transform 200ms ease-out",
          touchAction: "pan-y",
        }}
        role="button"
        tabIndex={0}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
          didSwipe.current = false;
        }}
        onTouchMove={(e) => {
          if (!touchStart.current) return;
          const t = e.touches[0];
          const dx = t.clientX - touchStart.current.x;
          const dy = t.clientY - touchStart.current.y;
          if (Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS && Math.abs(dx) > 6) {
            didSwipe.current = true;
            // Clamp the visual drag so the card doesn't fly off-screen.
            setDragDx(Math.max(-120, Math.min(120, dx)));
          }
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          setDragDx(0);
          if (!start) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (
            Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS &&
            Math.abs(dx) > SWIPE_THRESHOLD
          ) {
            didSwipe.current = true;
            if (dx < 0) setIndex((i) => Math.min(nearby.length - 1, i + 1));
            else setIndex((i) => Math.max(0, i - 1));
          }
        }}
        onClick={() => {
          // Suppress fly-in when the touchend just registered as a swipe.
          if (didSwipe.current) {
            didSwipe.current = false;
            return;
          }
          onSelect(
            poi.lng, poi.lat,
            {
              id: poi.id, name: poi.name, description: poi.description,
              destination: poi.destination, country: poi.country,
              culture_key: poi.culture_key, hero_picture: poi.hero_picture,
            },
            // Soft pan even on direct card tap — the cinematic flyTo with
            // pitch+zoom change felt jerky when the user is already close to
            // the POI. 'fly' (hard) is reserved for direct marker taps on the map.
            'soft',
          );
        }}
      >
        {/* Hero picture */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden bg-white/5"
          style={{ width: 84, height: 84 }}
        >
          {poi.hero_picture ? (
            <img
              src={poi.hero_picture}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <img
              src={`${CULTURE_ICON_BASE}/${poi.culture_key}.png${CULTURE_ICON_QUERY}`}
              alt=""
              className="w-full h-full object-contain p-3 bg-white"
              loading="lazy"
            />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold leading-tight truncate">
              {poi.name}
            </div>
            {locLine && (
              <div className="text-white/55 text-[11px] mt-0.5 truncate">{locLine}</div>
            )}
            {poi.description && (
              <div className="text-white/70 text-[11px] mt-1 line-clamp-2 leading-snug">
                {poi.description}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/8 border border-white/12">
              <img
                src={`${CULTURE_ICON_BASE}/${poi.culture_key}.png${CULTURE_ICON_QUERY}`}
                alt=""
                className="w-3 h-3 rounded-full"
              />
              <span className="text-white text-[9px] font-semibold uppercase tracking-wider">
                {cultureLabel(poi.culture_key)}
              </span>
            </div>
            <span className="text-white/60 text-[11px]">{distLabel}</span>
          </div>
        </div>

        {/* Right: nav arrows + index */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Next nearby quest"
            disabled={index >= nearby.length - 1}
            onClick={() => setIndex((i) => Math.min(nearby.length - 1, i + 1))}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <span className="text-white/55 text-[10px] font-medium">
            {index + 1}/{nearby.length}
          </span>
          <button
            type="button"
            aria-label="Previous nearby quest"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
