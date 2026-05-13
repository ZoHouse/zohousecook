import mapboxgl from 'mapbox-gl';

const POI_SOURCE = 'pois';
const CIRCLE_LAYER = 'pois-circle';
const SYMBOL_LAYER = 'pois-symbol';
const HITAREA_LAYER = 'pois-hitarea'; // invisible, expanded for touch taps

// IMPORTANT: use cdn.zo.xyz (NOT proxy.cdn.zo.xyz). The proxy host is
// imgproxy and unconditionally serves AVIF — Mapbox's image loader cannot
// decode AVIF and silently fails, leaving every marker invisible. The bare
// cdn host serves a real PNG; ?w=128 server-resizes (~25KB per icon vs
// 2.6MB original).
const CULTURE_ICON_BASE = 'https://cdn.zo.xyz/profile/culture';
const CULTURE_ICON_QUERY = '?w=128';

// Composed marker geometry. We render each culture as a circular white
// badge with the sticker fit inside (aspect ratio preserved, no clipping).
//
// BADGE_PX is a power of 2 so Mapbox's WebGL textures can mipmap properly
// — non-pow2 textures fall back to linear filter which looks soft.
const BADGE_CSS_PX = 32;       // on-screen target size at icon-size = 1
const BADGE_PIXEL_RATIO = 4;   // 4× density → 128px texture
const BADGE_PX = BADGE_CSS_PX * BADGE_PIXEL_RATIO;     // 128 — power of 2
// Inset between the sticker's bounding box and the badge ring. Raw pixels
// against the 128-px canvas — sticker fills ~85% of badge diameter.
const STICKER_INSET = 10;

/** Compose a circular white badge with the sticker masked inside, return
 * ImageData ready for Mapbox.addImage. */
function composeBadge(sticker: HTMLImageElement | ImageBitmap): ImageData | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = BADGE_PX;
  canvas.height = BADGE_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const cx = BADGE_PX / 2;
  const cy = BADGE_PX / 2;
  const radius = BADGE_PX / 2 - 1;

  // Drop shadow → marker pops on dusk basemap.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 6 * BADGE_PIXEL_RATIO;
  ctx.shadowOffsetY = 1.5 * BADGE_PIXEL_RATIO;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset shadow before drawing the raster icon.
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Fit the sticker inside the badge with breathing room. Preserve aspect
  // ratio (no force-square stretch) and DO NOT clip to a circle — PNG
  // transparent areas show through naturally, and sticker corners aren't
  // chopped off. Largest-side scale-to-fit.
  const maxSide = BADGE_PX - STICKER_INSET * 2;
  const sw = (sticker as { width: number }).width;
  const sh = (sticker as { height: number }).height;
  const aspect = sw && sh ? sw / sh : 1;
  let drawW: number, drawH: number;
  if (aspect >= 1) {
    drawW = maxSide;
    drawH = maxSide / aspect;
  } else {
    drawH = maxSide;
    drawW = maxSide * aspect;
  }
  ctx.drawImage(sticker, cx - drawW / 2, cy - drawH / 2, drawW, drawH);

  // Outer ring stroke.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1 * BADGE_PIXEL_RATIO;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  return ctx.getImageData(0, 0, BADGE_PX, BADGE_PX);
}

/**
 * Lazy-load a culture sticker via Mapbox's native loader (CORS-correct
 * caching) → compose into a circular badge → register with Mapbox →
 * trigger a repaint so the symbol layer picks it up immediately.
 * Idempotent. Failures are non-fatal — the dot beneath stays.
 */
function registerCultureIcon(map: mapboxgl.Map, key: string): void {
  const name = `culture-${key}`;
  if (map.hasImage(name)) return;
  const url = `${CULTURE_ICON_BASE}/${key}.png${CULTURE_ICON_QUERY}`;
  console.log(`[poi] loading culture sticker: ${key} ← ${url}`);
  map.loadImage(url, (err, sticker) => {
    if (err || !sticker) {
      console.warn(`[poi] FAILED culture '${key}':`, err);
      return;
    }
    if (map.hasImage(name)) return;
    const badge = composeBadge(sticker as unknown as HTMLImageElement);
    if (!badge) {
      console.warn(`[poi] composeBadge returned null for '${key}'`);
      return;
    }
    map.addImage(name, badge, { pixelRatio: BADGE_PIXEL_RATIO });
    map.triggerRepaint();
    console.log(`[poi] ✓ registered culture-${key}`);
  });
}

/** Haversine in metres — duplicated from LiveLocationProvider to avoid
 * pulling React deps into this WebGL helper. */
function haversineM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtDist(m: number): string {
  if (m < 1000) return `${Math.round(m)} m away`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km away`;
}

function buildPopupHTML(
  props: GeoJSON.GeoJsonProperties,
  poiLngLat: [number, number],
  viewer: { lat: number; long: number } | null,
): string {
  if (!props) return '';
  const name = String(props.name || 'Unnamed');
  const dest = String(props.destination || '');
  const country = String(props.country || '');
  const cultureKey = String(props.culture_key || 'follow-your-heart');
  const cultureLabel = cultureKey
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const description = String(props.description || '');
  const heroPic = props.hero_picture ? String(props.hero_picture) : '';
  const poiId = String(props.id || '');

  const heroHtml = heroPic
    ? `<div style="position:relative;margin:-12px -16px 10px;height:140px;border-radius:8px 8px 0 0;overflow:hidden;background:#1a1a1a;">
         <img src="${escapeHtml(heroPic)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
         <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);"></div>
       </div>`
    : '';

  // Distance from viewer (Erum's ask #1). Hidden when no live location yet.
  const distHtml = viewer
    ? `<span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:6px;">· ${fmtDist(haversineM(viewer.lat, viewer.long, poiLngLat[1], poiLngLat[0]))}</span>`
    : '';

  const locationLine = [dest, country].filter(Boolean).join(', ');

  // Walk here CTA — only when we know where the viewer is. Click is captured
  // by a delegated listener on map.getContainer() in mountPoiLayers below.
  const walkHereHtml = viewer
    ? `<button type="button"
         data-action="walk-here"
         data-poi-id="${escapeHtml(poiId)}"
         data-lng="${poiLngLat[0]}"
         data-lat="${poiLngLat[1]}"
         style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 12px;border-radius:99px;background:#FF2F8E;border:none;color:#fff;font-family:Rubik,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;box-shadow:0 4px 12px rgba(255,47,142,0.35);">
         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M13 5l7 7-7 7M5 12h15"/></svg>
         Walk here
       </button>`
    : '';

  // Fluid: min-width keeps it readable on big screens, popup container caps
  // total width via Mapbox Popup `maxWidth` so it never overflows phone screens.
  return `
    <div style="font-family:Rubik,sans-serif;padding:12px 16px;min-width:200px;max-width:100%;box-sizing:border-box;color:#fff;">
      ${heroHtml}
      <div style="font-size:14px;font-weight:600;color:#fff;line-height:1.3;margin-bottom:4px;word-wrap:break-word;">${escapeHtml(name)}</div>
      ${locationLine || distHtml ? `<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:10px;">${escapeHtml(locationLine)}${distHtml}</div>` : ''}
      ${description ? `<div style="font-size:12px;color:rgba(255,255,255,0.75);line-height:1.45;margin-bottom:10px;">${escapeHtml(description)}</div>` : ''}
      <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:99px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);">
        <img src="${CULTURE_ICON_BASE}/${cultureKey}.png${CULTURE_ICON_QUERY}" alt="" style="width:14px;height:14px;border-radius:50%;" loading="lazy" />
        <span style="font-size:10px;color:#fff;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(cultureLabel)}</span>
      </div>
      ${walkHereHtml}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Mount the POI overlay onto a Mapbox map. Idempotent: if the layers are
 * already registered, this is a no-op. Returns an unmount fn that tears
 * down layers, source, registered icons, and listeners.
 *
 * Behaviour:
 *  - Low zoom (11–14): a small neutral dot (cluster cue, mass density).
 *  - Zoom ≥ 14: the POI's culture sticker as a circular icon.
 *  - Click any POI → popup with hero picture + culture chip.
 */
/**
 * Live viewer location for distance computation in popups. The MapModal
 * updates this between map.on('click') registrations by re-mounting if the
 * location changes — but for popups already open, we capture the latest via
 * the function passed in.
 */
export function mountPoiLayers(
  map: mapboxgl.Map,
  geojson: GeoJSON.FeatureCollection,
  /**
   * Returns the latest viewer location, or null if unknown. Called at click
   * time (not at mount time) so popups always show fresh distance.
   */
  getViewerLocation: () => { lat: number; long: number } | null = () => null,
  /**
   * Called when the citizen taps "Walk here" on a POI popup. The popup only
   * shows the button when getViewerLocation() returned a value, so `from` is
   * guaranteed-known at click time (we re-read at click time, not popup time).
   */
  onWalkHereRequested?: (
    from: [number, number],
    to: [number, number],
    poiId: string,
  ) => void,
): {
  unmount: () => void;
  /**
   * Programmatically focus a POI.
   *  - mode 'fly' (default): hard fly-in — zoom to ≥16, pitch 62, popup. Used by direct marker clicks.
   *  - mode 'soft':  smooth ease — preserves user's zoom + pitch, just pans the camera and updates popup. Used by carousel browsing so rapid flipping feels responsive.
   */
  showPoi: (lng: number, lat: number, properties: GeoJSON.GeoJsonProperties, mode?: 'fly' | 'soft') => void;
} {
  if (map.getSource(POI_SOURCE)) {
    return { unmount: () => undefined, showPoi: () => undefined };
  }

  console.log(`[poi] mountPoiLayers: ${geojson.features.length} features`);

  // DEBUG: register a synchronous fallback icon — a red 32x32 dot. Used by
  // the symbol layer until the culture sticker for a given POI loads.
  // If we see RED DOTS but no culture stickers → async load problem.
  // If we see NO red dots → the source/layer setup itself is broken.
  if (!map.hasImage('debug-fallback')) {
    const px = 32;
    const c = document.createElement('canvas');
    c.width = px; c.height = px;
    const x = c.getContext('2d');
    if (x) {
      x.fillStyle = '#ff2f8e';
      x.beginPath();
      x.arc(px / 2, px / 2, px / 2 - 1, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#fff';
      x.fillRect(px / 2 - 2, px / 2 - 2, 4, 4);
      map.addImage('debug-fallback', x.getImageData(0, 0, px, px));
      console.log('[poi] debug-fallback icon registered');
    }
  }

  // 1) Lazy-register one Mapbox image per unique culture in the data.
  const cultures = new Set<string>();
  for (const f of geojson.features) {
    const k = (f.properties as Record<string, unknown> | null)?.culture_key;
    if (typeof k === 'string') cultures.add(k);
  }
  console.log(`[poi] registering ${cultures.size} unique cultures:`, [...cultures].sort().join(', '));
  // Fire-and-forget: each culture sticker registers when its image arrives.
  // Symbol layer reads `icon-image` lazily so missing icons just don't
  // render until the load completes (followed by a triggerRepaint inside
  // registerCultureIcon).
  const registeredIcons: string[] = cultures.size ? [] : [];
  for (const key of cultures) {
    registerCultureIcon(map, key);
    registeredIcons.push(`culture-${key}`);
  }

  // 2) Source.
  map.addSource(POI_SOURCE, { type: 'geojson', data: geojson, generateId: true });

  // 3) Tiny density dots at country/region zoom (8–10) — gives a sense of
  //    where Quests cluster before the badges become legible. The badge
  //    symbol layer takes over from zoom 10+.
  map.addLayer({
    id: CIRCLE_LAYER,
    type: 'circle',
    source: POI_SOURCE,
    minzoom: 4,
    maxzoom: 10,
    filter: ['!=', ['get', 'near_property'], true],
    paint: {
      'circle-color': '#ffffff',
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        4, 1,
        7, 1.6,
        10, 2.4,
      ],
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        4, 0.35,
        7, 0.55,
        10, 0.7,
      ],
      'circle-stroke-width': 0.5,
      'circle-stroke-color': 'rgba(0,0,0,0.4)',
    },
  });

  // 3.5) Invisible expanded hit-area circle so touch users can comfortably
  //      tap the small markers (Apple/Google touch target ≥ 44px guideline).
  map.addLayer({
    id: HITAREA_LAYER,
    type: 'circle',
    source: POI_SOURCE,
    minzoom: 11,
    filter: ['!=', ['get', 'near_property'], true],
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        11, 10,    // ~20px tap area at low zoom
        14, 18,    // ~36px tap area
        18, 28,    // ~56px tap area at deep zoom
      ],
      'circle-opacity': 0,        // invisible
      'circle-stroke-width': 0,
    },
  });

  // 4) Culture sticker badge symbol layer — visible from zoom 10 (city level)
  //    onwards. At low zoom the badges are tiny (cluster cue), they grow as
  //    the user dives in. Always-show (no collision detection) so dense areas
  //    aren't culled — user disambiguates stacks by zooming in.
  map.addLayer({
    id: SYMBOL_LAYER,
    type: 'symbol',
    source: POI_SOURCE,
    minzoom: 10,
    filter: ['!=', ['get', 'near_property'], true],
    layout: {
      // Try the per-POI culture sticker first; if its image hasn't yet
      // registered (still loading from CDN), fall back to the synchronous
      // pink dot so markers always render. As each sticker resolves,
      // registerCultureIcon → triggerRepaint swaps dots → stickers in place.
      'icon-image': [
        'coalesce',
        ['image', ['concat', 'culture-', ['get', 'culture_key']]],
        ['image', 'debug-fallback'],
      ] as unknown as string,
      // Badge is composed at BADGE_CSS_PX (32px) — icon-size 1.0 = 32px on
      // screen. Sizes tuned so the culture sticker is readable from city zoom
      // onwards.
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        10, 0.55,  // ~18px — visible at city zoom
        12, 0.75,  // ~24px
        14, 1.00,  // ~32px (native)
        16, 1.30,  // ~42px
        18, 1.70,  // ~54px
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-anchor': 'center',
    },
  });

  // 5) Click → popup.
  // Cap popup at min(280px, 90vw) so it never overflows a phone screen.
  const popupMaxWidth =
    typeof window !== 'undefined'
      ? `${Math.min(280, Math.floor(window.innerWidth * 0.9))}px`
      : '280px';
  // Single shared instance → clicking another marker just moves it; only one
  // popup ever on screen. closeOnClick auto-dismisses on basemap tap.
  const popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    closeOnMove: false,    // survives the flyTo animation
    className: 'zo-map-popup',
    maxWidth: popupMaxWidth,
    // Anchor BOTTOM = popup hangs ABOVE the marker. Keeps it in the upper
    // half of the map so it never collides with the bottom carousel card.
    anchor: 'bottom',
    offset: 18,
  });

  // Unified focus action. Two modes:
  //   'fly'  → hard fly-in (zoom ≥16, pitch 62) — for explicit marker clicks
  //   'soft' → easeTo (preserves zoom & pitch, ~450ms) — for carousel scrubbing
  const focusPoi = (
    lng: number,
    lat: number,
    properties: GeoJSON.GeoJsonProperties,
    mode: 'fly' | 'soft' = 'fly',
  ) => {
    if (mode === 'fly') {
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 16),
        pitch: 62,
        bearing: map.getBearing(),
        offset: [0, 120],   // marker in lower half, popup-above lands centered
        speed: 1.2,
        curve: 1.5,
        essential: true,
      });
    } else {
      // Soft browse — TRUE cinematic flyTo for both arrow tap and card tap.
      //
      // The trick: force `minZoom` to dip ~2 levels below current zoom on
      // the arc's apex. Without this, Mapbox's natural arc for short hops
      // (within a city) is so shallow you can't perceive the lift-off →
      // looks like a flat pan. With it, every hop has a perceptible
      // "rise → glide → drop" motion regardless of distance.
      const currentZoom = map.getZoom();
      const arcMinZoom = Math.max(currentZoom - 2.2, 8);

      const showPopupAtRest = () => {
        popup
          .setLngLat([lng, lat])
          .setHTML(buildPopupHTML(properties, [lng, lat], getViewerLocation()))
          .addTo(map);
      };

      // Close any open popup so it doesn't drag with the camera animation.
      if (popup.isOpen()) popup.remove();

      // minZoom is documented in mapbox-gl FlyToOptions but missing from this
      // version's TS types — cast through `unknown` to keep tsc happy.
      map.flyTo({
        center: [lng, lat],
        zoom: currentZoom,        // land back at the same zoom they were at
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        // +120px Y → marker sits in the LOWER half of the viewport so the
        // popup (anchored above the marker) lands comfortably in the center.
        offset: [0, 120],         // marker sits above the bottom carousel
        curve: 1.42,              // Apple-Maps-like arc shape
        duration: 1300,           // responsive but cinematic
        essential: true,
        ...({ minZoom: arcMinZoom } as unknown as Record<string, never>), // arc apex
      });
      // Open the popup once the camera lands — avoids mid-flight reflow.
      map.once('moveend', showPopupAtRest);
      return;
    }
    popup
      .setLngLat([lng, lat])
      .setHTML(buildPopupHTML(properties, [lng, lat], getViewerLocation()))
      .addTo(map);
  };

  const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
    focusPoi(lng, lat, feature.properties, 'fly');
  };

  // Hit-area layer covers both circle and symbol — single click handler is enough.
  map.on('click', HITAREA_LAYER, handleClick);

  const setPointer = () => { map.getCanvas().style.cursor = 'pointer'; };
  const unsetPointer = () => { map.getCanvas().style.cursor = ''; };
  map.on('mouseenter', HITAREA_LAYER, setPointer);
  map.on('mouseleave', HITAREA_LAYER, unsetPointer);

  // Delegated click listener for the "Walk here" button inside the popup
  // HTML. Scoped to the map container — popup DOM lives inside it.
  const container = map.getContainer();
  const handleWalkHereClick = (e: Event) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest('[data-action="walk-here"]') as HTMLElement | null;
    if (!btn) return;
    e.stopPropagation();
    const lng = parseFloat(btn.dataset.lng ?? '');
    const lat = parseFloat(btn.dataset.lat ?? '');
    const poiId = btn.dataset.poiId ?? '';
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    const viewer = getViewerLocation();
    if (!viewer) return; // shouldn't happen — button only renders when viewer known
    // Auto-close popup so it doesn't block the route reveal + camera flight.
    popup.remove();
    onWalkHereRequested?.([viewer.long, viewer.lat], [lng, lat], poiId);
  };
  container.addEventListener('click', handleWalkHereClick);

  const unmount = () => {
    try {
      map.off('click', HITAREA_LAYER, handleClick);
      map.off('mouseenter', HITAREA_LAYER, setPointer);
      map.off('mouseleave', HITAREA_LAYER, unsetPointer);
      container.removeEventListener('click', handleWalkHereClick);
      popup.remove();
      if (map.getLayer(SYMBOL_LAYER)) map.removeLayer(SYMBOL_LAYER);
      if (map.getLayer(CIRCLE_LAYER)) map.removeLayer(CIRCLE_LAYER);
      if (map.getLayer(HITAREA_LAYER)) map.removeLayer(HITAREA_LAYER);
      if (map.getSource(POI_SOURCE)) map.removeSource(POI_SOURCE);
      for (const name of registeredIcons) {
        if (map.hasImage(name)) map.removeImage(name);
      }
    } catch {
      // Map may already be torn down; ignore.
    }
  };

  return { unmount, showPoi: focusPoi };
}
