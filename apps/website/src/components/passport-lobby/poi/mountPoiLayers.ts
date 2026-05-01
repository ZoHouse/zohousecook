import mapboxgl from 'mapbox-gl';
import { BUCKETS, BUCKET_IDS, type BucketId } from './clusters';

const POI_SOURCE = 'pois';
const CIRCLE_LAYER = 'pois-circle';
const SYMBOL_LAYER = 'pois-symbol';

const ICON_PIXEL_RATIO = 2;
const ICON_RENDER_SIZE = 24; // SVG viewBox; canvas backed at 2x

/**
 * Render a Lucide-style line icon (single SVG path, white stroke) into an
 * ImageData buffer that Mapbox can register via `map.addImage`. Path2D parses
 * the SVG `d` string natively, so no DOM/SVG element gymnastics.
 */
function renderIconImage(pathD: string): ImageData | null {
  if (typeof document === 'undefined') return null;
  const px = ICON_RENDER_SIZE * ICON_PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(ICON_PIXEL_RATIO, ICON_PIXEL_RATIO);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0)';

  try {
    const path = new Path2D(pathD);
    ctx.stroke(path);
  } catch {
    return null;
  }
  return ctx.getImageData(0, 0, px, px);
}

/** Mapbox `match` expression for circle-color, sourced from BUCKETS so
 * the palette stays single-sourced. Falls back to neutral grey. */
function circleColorExpression(): mapboxgl.Expression {
  const args: (string | number)[] = ['match', ['get', 'cluster'] as unknown as string];
  for (const id of BUCKET_IDS) {
    args.push(id, BUCKETS[id].color);
  }
  args.push('#888'); // default
  return args as unknown as mapboxgl.Expression;
}

function buildPopupHTML(props: GeoJSON.GeoJsonProperties): string {
  if (!props) return '';
  const cluster = (props.cluster as BucketId) || 'place';
  const bucket = BUCKETS[cluster];
  const name = String(props.name || 'Unnamed');
  const dest = String(props.dest || '');
  return `
    <div style="font-family:Rubik,sans-serif;padding:4px 8px;min-width:180px;color:#fff;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${bucket.color};display:inline-block;flex-shrink:0;box-shadow:0 0 0 3px ${bucket.color}33;"></span>
        <div style="font-size:14px;font-weight:600;color:#fff;line-height:1.25;">${escapeHtml(name)}</div>
      </div>
      ${dest ? `<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:8px;">${escapeHtml(dest)}</div>` : ''}
      <div style="display:inline-block;font-size:9px;color:${bucket.color};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:3px 8px;border-radius:99px;background:${bucket.color}22;border:1px solid ${bucket.color}44;">${bucket.label}</div>
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
 * already registered (e.g. style reload), this is a no-op. Returns an
 * unmount fn that tears down layers, source, registered icons, and listeners.
 */
export function mountPoiLayers(
  map: mapboxgl.Map,
  geojson: GeoJSON.FeatureCollection,
): () => void {
  // Already mounted — bail. (Style reloads strip layers; the caller should
  // re-invoke us after `style.load`, but this guard makes accidental dupes
  // safe.)
  if (map.getSource(POI_SOURCE)) return () => undefined;

  // 1) Register the 7 cluster icons. Names: cluster-food, cluster-nature, …
  const registeredIcons: string[] = [];
  for (const id of BUCKET_IDS) {
    const name = `cluster-${id}`;
    if (map.hasImage(name)) continue;
    const img = renderIconImage(BUCKETS[id].icon);
    if (!img) continue;
    map.addImage(name, img, { pixelRatio: ICON_PIXEL_RATIO });
    registeredIcons.push(name);
  }

  // 2) Source.
  map.addSource(POI_SOURCE, { type: 'geojson', data: geojson, generateId: true });

  // 3) Circle layer — primary visual at zoom 11–14, smaller dot underneath
  //    the icon at higher zoom. Hidden for POIs that sit within 60m of a
  //    property pillar (would be invisible/redundant under the pillar).
  map.addLayer({
    id: CIRCLE_LAYER,
    type: 'circle',
    source: POI_SOURCE,
    minzoom: 11,
    filter: ['!=', ['get', 'near_property'], true],
    paint: {
      'circle-color': circleColorExpression(),
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        11, 2.5,
        13, 4,
        14, 6,
        17, 8,
      ],
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        11, 0.55,
        13, 0.8,
        14, 0.9,
      ],
      'circle-stroke-width': 0.5,
      'circle-stroke-color': 'rgba(0,0,0,0.4)',
    },
  });

  // 4) Symbol layer — white glyph drawn over the dot, only at zoom ≥ 14.5
  //    (gated half a zoom above circle so they don't both pop in at once).
  map.addLayer({
    id: SYMBOL_LAYER,
    type: 'symbol',
    source: POI_SOURCE,
    minzoom: 14.5,
    filter: ['!=', ['get', 'near_property'], true],
    layout: {
      'icon-image': ['concat', 'cluster-', ['get', 'cluster']] as unknown as string,
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        14.5, 0.5,
        17, 0.8,
      ],
      'icon-allow-overlap': false,
      'icon-ignore-placement': false,
    },
  });

  // 5) Click → popup. One shared popup instance, reused.
  const popup = new mapboxgl.Popup({
    closeButton: true,
    className: 'zo-map-popup',
    maxWidth: '260px',
    offset: 12,
  });

  const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;

    // Pan-and-tilt the camera to the POI. We always raise zoom to at least
    // 16 so the icon and surrounding 3D context are readable, but never
    // zoom OUT (preserves user's mental model when they're already deep).
    const targetZoom = Math.max(map.getZoom(), 16);
    map.flyTo({
      center: [lng, lat],
      zoom: targetZoom,
      pitch: 62,
      bearing: map.getBearing(),
      // Shift the visual focus point ~70px below screen center so the
      // popup (which renders above the marker) lands near the eye line.
      offset: [0, 70],
      speed: 1.2,
      curve: 1.5,
      essential: true,
    });

    // Mapbox keeps the popup anchored to its lng/lat during the fly, so
    // setting it now is fine — it tracks the camera all the way in.
    popup
      .setLngLat([lng, lat])
      .setHTML(buildPopupHTML(feature.properties))
      .addTo(map);
  };

  // The circle layer is present whenever the symbol layer is (circle min
  // zoom 11, symbol 14.5), so registering on circle alone catches every
  // POI click without firing the handler twice.
  map.on('click', CIRCLE_LAYER, handleClick);

  const setPointer = () => {
    map.getCanvas().style.cursor = 'pointer';
  };
  const unsetPointer = () => {
    map.getCanvas().style.cursor = '';
  };
  map.on('mouseenter', SYMBOL_LAYER, setPointer);
  map.on('mouseleave', SYMBOL_LAYER, unsetPointer);
  map.on('mouseenter', CIRCLE_LAYER, setPointer);
  map.on('mouseleave', CIRCLE_LAYER, unsetPointer);

  return () => {
    try {
      map.off('click', CIRCLE_LAYER, handleClick);
      map.off('mouseenter', SYMBOL_LAYER, setPointer);
      map.off('mouseleave', SYMBOL_LAYER, unsetPointer);
      map.off('mouseenter', CIRCLE_LAYER, setPointer);
      map.off('mouseleave', CIRCLE_LAYER, unsetPointer);
      popup.remove();
      if (map.getLayer(SYMBOL_LAYER)) map.removeLayer(SYMBOL_LAYER);
      if (map.getLayer(CIRCLE_LAYER)) map.removeLayer(CIRCLE_LAYER);
      if (map.getSource(POI_SOURCE)) map.removeSource(POI_SOURCE);
      for (const name of registeredIcons) {
        if (map.hasImage(name)) map.removeImage(name);
      }
    } catch {
      // Map may already be torn down; ignore.
    }
  };
}
