import mapboxgl from 'mapbox-gl';

const PUCK_COLOR = '#00B4FF';
const POSITION_EASE_MS = 800;

export interface UserPuckHandles {
  setPosition: (lng: number, lat: number, heading: number | null) => void;
  hide: () => void;
  unmount: () => void;
}

/**
 * Outer is the Mapbox-positioned container (never set transform on it).
 * Inner carries our rotation transform so it doesn't fight positioning.
 * The arrow points "north" of the puck — rotated to match heading.
 */
function buildPuckElement(): { outer: HTMLDivElement; inner: HTMLDivElement } {
  const outer = document.createElement('div');
  outer.style.cssText = 'width:48px;height:48px;pointer-events:none;';

  const inner = document.createElement('div');
  inner.style.cssText =
    'position:relative;width:100%;height:100%;transform-origin:center;transition:transform 280ms ease-out;';

  const arrow = document.createElement('div');
  arrow.style.cssText =
    `position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;` +
    `border-left:6px solid transparent;border-right:6px solid transparent;` +
    `border-bottom:10px solid ${PUCK_COLOR};` +
    `filter:drop-shadow(0 0 4px ${PUCK_COLOR});`;

  const dot = document.createElement('div');
  dot.style.cssText =
    `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);` +
    `width:18px;height:18px;border-radius:50%;background:${PUCK_COLOR};` +
    `border:2px solid #fff;` +
    `box-shadow:0 0 0 4px rgba(0,180,255,0.28),0 0 16px ${PUCK_COLOR};`;

  inner.appendChild(dot);
  inner.appendChild(arrow);
  outer.appendChild(inner);
  return { outer, inner };
}

/**
 * Mounts a user-position puck on the map. Position transitions ease between
 * updates (rAF, ~800ms ease-out cubic) so the puck glides instead of
 * snapping. Heading rotates the inner element via CSS transform.
 */
export function mountUserPuck(map: mapboxgl.Map): UserPuckHandles {
  const { outer, inner } = buildPuckElement();
  const marker = new mapboxgl.Marker({ element: outer, anchor: 'center' });

  let currentLng = 0;
  let currentLat = 0;
  let initialized = false;
  let animFrame: number | null = null;

  const cancelAnim = () => {
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  };

  const setPosition = (lng: number, lat: number, heading: number | null) => {
    if (heading !== null && !Number.isNaN(heading)) {
      // Account for the marker's own anchor/rotation — Mapbox doesn't rotate
      // the marker with the map, so heading is pure compass degrees.
      inner.style.transform = `rotate(${heading}deg)`;
    }

    if (!initialized) {
      currentLng = lng;
      currentLat = lat;
      marker.setLngLat([lng, lat]);
      marker.addTo(map);
      initialized = true;
      return;
    }

    cancelAnim();
    const startLng = currentLng;
    const startLat = currentLat;
    const targetLng = lng;
    const targetLat = lat;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - startTime) / POSITION_EASE_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      currentLng = startLng + (targetLng - startLng) * eased;
      currentLat = startLat + (targetLat - startLat) * eased;
      marker.setLngLat([currentLng, currentLat]);
      if (t < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        animFrame = null;
      }
    };
    animFrame = requestAnimationFrame(tick);
  };

  const hide = () => {
    cancelAnim();
    marker.remove();
    initialized = false;
  };

  const unmount = () => {
    cancelAnim();
    marker.remove();
  };

  return { setPosition, hide, unmount };
}
