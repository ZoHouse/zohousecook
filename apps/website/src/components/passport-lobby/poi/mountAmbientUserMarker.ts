import mapboxgl from 'mapbox-gl';

const RING_COLOR = '#00B4FF';
const POSITION_EASE_MS = 800;
const PULSE_STYLE_TAG = 'data-zo-ambient-user-pulse';

export interface AmbientUserMarkerHandles {
  setPosition: (lng: number, lat: number) => void;
  unmount: () => void;
}

function injectPulseKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector(`style[${PULSE_STYLE_TAG}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(PULSE_STYLE_TAG, '');
  style.textContent =
    '@keyframes zo-ambient-user-pulse {' +
      '0% { transform: scale(0.85); opacity: 0.55; }' +
      '100% { transform: scale(1.7); opacity: 0; }' +
    '}';
  document.head.appendChild(style);
}

/**
 * Ambient explore-mode user marker — a Zobu avatar pin with a soft cyan pulse
 * ring. Falls back to a plain cyan dot when the citizen has no avatar set
 * (avatarUrl null/undefined or the <img> errors out).
 *
 * Distinct from `mountUserPuck` (nav-mode only, directional arrow, projection
 * swap). This one is non-interactive and stays put while the camera moves.
 */
function buildMarkerElement(avatarUrl: string | null): HTMLDivElement {
  injectPulseKeyframes();

  // Outer: Mapbox-positioned container. NEVER set transform on this.
  // pointer-events:none so clicks pass through to underlying markers / POIs.
  // z-index lifts the avatar above the property pillars (which mount later
  // and would otherwise stack on top of us).
  const outer = document.createElement('div');
  outer.style.cssText =
    'width:52px;height:52px;pointer-events:none;z-index:5;' +
    'position:relative;display:flex;align-items:center;justify-content:center;';

  // Pulse ring — absolutely positioned behind the avatar, scales out to 1.7x.
  const pulse = document.createElement('div');
  pulse.style.cssText =
    'position:absolute;top:50%;left:50%;width:40px;height:40px;' +
    'margin-left:-20px;margin-top:-20px;border-radius:50%;' +
    `background:${RING_COLOR};opacity:0.5;` +
    'animation:zo-ambient-user-pulse 2s ease-out infinite;';

  // Avatar pin — cyan filled circle, 2px white inner ring, cyan glow halo.
  const pin = document.createElement('div');
  pin.style.cssText =
    'position:relative;width:40px;height:40px;border-radius:50%;' +
    `background:${RING_COLOR};border:2px solid #fff;` +
    `box-shadow:0 0 0 2px ${RING_COLOR},0 4px 12px rgba(0,0,0,0.35);` +
    'overflow:hidden;display:flex;align-items:center;justify-content:center;';

  if (avatarUrl) {
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.addEventListener('error', () => {
      // Avatar URL bad → silently fall back so the user still sees a pin.
      img.remove();
    });
    pin.appendChild(img);
  }

  outer.appendChild(pulse);
  outer.appendChild(pin);
  return outer;
}

export function mountAmbientUserMarker(
  map: mapboxgl.Map,
  avatarUrl: string | null,
): AmbientUserMarkerHandles {
  const element = buildMarkerElement(avatarUrl);
  const marker = new mapboxgl.Marker({ element, anchor: 'center' });

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

  const setPosition = (lng: number, lat: number) => {
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
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - startTime) / POSITION_EASE_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      currentLng = startLng + (lng - startLng) * eased;
      currentLat = startLat + (lat - startLat) * eased;
      marker.setLngLat([currentLng, currentLat]);
      if (t < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        animFrame = null;
      }
    };
    animFrame = requestAnimationFrame(tick);
  };

  const unmount = () => {
    cancelAnim();
    marker.remove();
  };

  return { setPosition, unmount };
}
