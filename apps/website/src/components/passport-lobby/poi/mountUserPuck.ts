import mapboxgl from 'mapbox-gl';

const PUCK_COLOR = '#00B4FF';
const POSITION_EASE_MS = 800;

export interface UserPuckHandles {
  setPosition: (lng: number, lat: number, heading: number | null) => void;
  hide: () => void;
  unmount: () => void;
}

/**
 * Builds the puck DOM tree.
 *
 *   outer  ─ Mapbox-positioned container; NEVER touch its transform.
 *   ├── headingLayer  ─ rotates with bearing; contains ONLY the arrow.
 *   │   └── arrow     ─ directional triangle, point upward when heading=0.
 *   └── pin           ─ avatar disc; centered, does NOT rotate (otherwise
 *                       the avatar's eyes/face would tilt with bearing).
 *
 * The arrow swings around the puck perimeter as the citizen turns, while
 * the avatar stays upright. Fallback: a solid cyan dot if no avatar URL.
 */
function buildPuckElement(avatarUrl: string | null): {
  outer: HTMLDivElement;
  headingLayer: HTMLDivElement;
} {
  const outer = document.createElement('div');
  outer.style.cssText =
    'width:56px;height:56px;pointer-events:none;position:relative;';

  const headingLayer = document.createElement('div');
  headingLayer.style.cssText =
    'position:absolute;inset:0;transform-origin:center;' +
    'transition:transform 280ms ease-out;';

  const arrow = document.createElement('div');
  arrow.style.cssText =
    'position:absolute;top:-2px;left:50%;transform:translateX(-50%);' +
    'width:0;height:0;' +
    'border-left:7px solid transparent;border-right:7px solid transparent;' +
    `border-bottom:12px solid ${PUCK_COLOR};` +
    `filter:drop-shadow(0 0 4px ${PUCK_COLOR});`;
  headingLayer.appendChild(arrow);

  const pin = document.createElement('div');
  pin.style.cssText =
    'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'width:40px;height:40px;border-radius:50%;' +
    `background:${PUCK_COLOR};border:2px solid #fff;` +
    `box-shadow:0 0 0 2px ${PUCK_COLOR},0 4px 12px rgba(0,0,0,0.35);` +
    'overflow:hidden;display:flex;align-items:center;justify-content:center;';

  if (avatarUrl) {
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.alt = '';
    img.style.cssText =
      'width:100%;height:100%;object-fit:cover;display:block;';
    img.addEventListener('error', () => {
      // Bad URL → drop the img so the cyan disc shows through.
      img.remove();
    });
    pin.appendChild(img);
  }

  outer.appendChild(headingLayer);
  outer.appendChild(pin);
  return { outer, headingLayer };
}

/**
 * Mount the user-position puck on the map. Position transitions ease between
 * updates (rAF, ~800ms ease-out cubic) so the puck glides instead of
 * snapping. Heading rotates the heading layer (which carries only the
 * directional arrow) via CSS transform — the avatar pin itself stays
 * upright at all bearings.
 */
export function mountUserPuck(
  map: mapboxgl.Map,
  avatarUrl: string | null = null,
): UserPuckHandles {
  const { outer, headingLayer } = buildPuckElement(avatarUrl);
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
      headingLayer.style.transform = `rotate(${heading}deg)`;
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
