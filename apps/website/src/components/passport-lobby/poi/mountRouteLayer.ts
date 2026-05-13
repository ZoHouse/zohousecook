import mapboxgl from 'mapbox-gl';

const ROUTE_SOURCE = 'route';
const GLOW_LAYER = 'route-glow';
const LINE_LAYER = 'route-line';
const ARROWS_LAYER = 'route-arrows';
const CHEVRON_ICON = 'route-chevron';

// Route layers slot UNDER the POI symbol layer so culture badges sit on top
// of the line, not under it. mountPoiLayers adds 'pois-symbol' — if it's not
// present yet, we just stack on top.
const POI_SYMBOL_LAYER_ID = 'pois-symbol';

const ROUTE_COLOR = '#00B4FF';
const DRAW_IN_DURATION_MS = 1200;

function registerChevronIcon(map: mapboxgl.Map): void {
  if (map.hasImage(CHEVRON_ICON)) return;
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(18, size / 2);
  ctx.lineTo(8, size - 4);
  ctx.stroke();
  map.addImage(CHEVRON_ICON, ctx.getImageData(0, 0, size, size));
}

function emptyGeoJson(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return { type: 'FeatureCollection', features: [] };
}

function toFeatureCollection(
  geometry: GeoJSON.LineString,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry, properties: {} }],
  };
}

export interface RouteLayerHandles {
  drawRoute: (geometry: GeoJSON.LineString) => void;
  clear: () => void;
  unmount: () => void;
}

/**
 * Mounts a 3-layer route renderer on top of an existing map. Idempotent.
 *
 *  - route-glow:   wide soft halo (under)
 *  - route-line:   sharp pink line (middle)
 *  - route-arrows: chevron symbols flowing along the line (top)
 *
 * `drawRoute` swaps the geometry and animates `line-trim-offset` from
 * [0, 1] (fully trimmed = invisible) → [1, 1] (no trim = fully drawn).
 * Chevrons stay hidden during the animation, then fade in.
 */
export function mountRouteLayer(map: mapboxgl.Map): RouteLayerHandles {
  if (map.getSource(ROUTE_SOURCE)) {
    return { drawRoute: () => undefined, clear: () => undefined, unmount: () => undefined };
  }

  registerChevronIcon(map);

  map.addSource(ROUTE_SOURCE, {
    type: 'geojson',
    data: emptyGeoJson(),
    lineMetrics: true,
  });

  const beforeId = map.getLayer(POI_SYMBOL_LAYER_ID) ? POI_SYMBOL_LAYER_ID : undefined;

  map.addLayer(
    {
      id: GLOW_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROUTE_COLOR,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 12,
          14, 22,
          18, 34,
        ],
        'line-blur': 8,
        'line-opacity': 0.55,
        'line-emissive-strength': 1,
        'line-trim-offset': [0, 1],
      },
    },
    beforeId,
  );

  map.addLayer(
    {
      id: LINE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROUTE_COLOR,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 5,
          14, 7,
          18, 11,
        ],
        'line-opacity': 1,
        'line-emissive-strength': 1,
        'line-trim-offset': [0, 1],
      },
    },
    beforeId,
  );

  map.addLayer(
    {
      id: ARROWS_LAYER,
      type: 'symbol',
      source: ROUTE_SOURCE,
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 80,
        'icon-image': CHEVRON_ICON,
        'icon-size': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.5,
          14, 0.75,
          18, 1,
        ],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        visibility: 'none',
      },
      paint: { 'icon-opacity': 0.85 },
    },
    beforeId,
  );

  let animationFrameId: number | null = null;

  const cancelAnimation = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const drawRoute = (geometry: GeoJSON.LineString) => {
    cancelAnimation();

    const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(toFeatureCollection(geometry));

    map.setLayoutProperty(ARROWS_LAYER, 'visibility', 'none');
    map.setPaintProperty(GLOW_LAYER, 'line-trim-offset', [0, 1]);
    map.setPaintProperty(LINE_LAYER, 'line-trim-offset', [0, 1]);

    const startTime = performance.now();
    const tick = (now: number) => {
      // Clamp t to [0, 1] — `now < startTime` is possible on the first frame
      // due to frame-timing precision, and `eased` going negative trips
      // Mapbox's paint-property validation (line-trim-offset min is 0).
      const t = Math.max(0, Math.min(1, (now - startTime) / DRAW_IN_DURATION_MS));
      // Ease-out cubic — the line accelerates fast, settles gently.
      const eased = Math.max(0, Math.min(1, 1 - Math.pow(1 - t, 3)));
      map.setPaintProperty(GLOW_LAYER, 'line-trim-offset', [eased, 1]);
      map.setPaintProperty(LINE_LAYER, 'line-trim-offset', [eased, 1]);
      if (t < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        animationFrameId = null;
        map.setLayoutProperty(ARROWS_LAYER, 'visibility', 'visible');
      }
    };
    animationFrameId = requestAnimationFrame(tick);
  };

  const clear = () => {
    cancelAnimation();
    const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(emptyGeoJson());
    map.setLayoutProperty(ARROWS_LAYER, 'visibility', 'none');
    map.setPaintProperty(GLOW_LAYER, 'line-trim-offset', [0, 1]);
    map.setPaintProperty(LINE_LAYER, 'line-trim-offset', [0, 1]);
  };

  const unmount = () => {
    cancelAnimation();
    try {
      if (map.getLayer(ARROWS_LAYER)) map.removeLayer(ARROWS_LAYER);
      if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER);
      if (map.getLayer(GLOW_LAYER)) map.removeLayer(GLOW_LAYER);
      if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
      if (map.hasImage(CHEVRON_ICON)) map.removeImage(CHEVRON_ICON);
    } catch {
      // Map may already be torn down; ignore.
    }
  };

  return { drawRoute, clear, unmount };
}
