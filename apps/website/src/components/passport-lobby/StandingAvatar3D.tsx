import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

// Pointer movement (in CSS pixels) below this is treated as a tap (flip
// back to card); above is treated as a drag (rotate the avatar via
// model-viewer's camera-controls).
const TAP_DRAG_THRESHOLD_PX = 6;

// Webpack emits this as /_next/static/media/bro_idle.<hash>.glb via the
// asset/resource rule in apps/website/next.config.js. bro_idle is the rigged
// version with a baked idle animation, so motionAttrs.autoplay drives it.
import MODEL_URL from '../../assets/3d/bro_idle.glb';

export interface StandingAvatar3DProps {
  /** Click anywhere on the avatar to flip back to the card view. */
  onClick: () => void;
}

// Same outer footprint as CitizenCard (200×~280) so the pedestal sit doesn't
// shift when the user toggles between card and avatar.
const FOOTPRINT_WIDTH = 200;
const FOOTPRINT_HEIGHT = 280;

export function StandingAvatar3D({ onClick }: StandingAvatar3DProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState(false);
  // Custom-element registration takes a tick; the GLB itself is ~4MB. Until
  // both land, render a skeleton so the slot doesn't look broken.
  const [ready, setReady] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Dynamic import keeps the model-viewer custom element out of the main bundle.
  useEffect(() => {
    import('@google/model-viewer').catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const onError = () => setFailed(true);
    const onLoad = () => setReady(true);
    el.addEventListener('error', onError);
    el.addEventListener('load', onLoad);
    return () => {
      el.removeEventListener('error', onError);
      el.removeEventListener('load', onLoad);
    };
  }, []);

  const handleKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  // Tap-vs-drag detection: model-viewer captures pointer for camera-controls,
  // so we record the pointerdown coordinates and compare on pointerup. Small
  // movement = tap (flip back to card). Larger movement = the user dragged
  // to rotate the avatar — don't fire the flip.
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    downRef.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = downRef.current;
    downRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) <= TAP_DRAG_THRESHOLD_PX) onClick();
  };

  // Only autoplay the GLB's baked idle animation. Camera stays fixed — the
  // model's own motion is what the user should see.
  const motionAttrs = reducedMotion ? {} : ({ autoplay: true } as const);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Tap to switch to card, drag to rotate"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKey}
      className="relative cursor-grab active:cursor-grabbing"
      style={{
        width: FOOTPRINT_WIDTH,
        height: FOOTPRINT_HEIGHT,
        // Float closer to the pedestal — nudges the avatar visually down
        // by pulling everything below it up.
        marginBottom: -22,
        background: 'transparent',
        // Hand drags to model-viewer's camera-controls instead of letting
        // the page swipe-scroll on mobile.
        touchAction: 'none',
      }}
    >
      {failed ? (
        // Graceful fallback: a soft pearl placeholder so the slot keeps its
        // height. The flip control is still wired so the user can return.
        <div
          aria-hidden
          className="w-full h-full rounded-2xl flex items-center justify-center text-[12px] text-black/60"
          style={{ background: 'linear-gradient(180deg, #F2E0EC 0%, #E6D9F2 100%)' }}
        >
          3D unavailable — tap to return
        </div>
      ) : (
        <>
          {!ready && (
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl flex items-center justify-center text-[11px] text-black/50"
              style={{
                background:
                  'linear-gradient(180deg, rgba(242,224,236,0.6) 0%, rgba(230,217,242,0.6) 100%)',
                animation: 'lobbyAvatarPulse 1.4s ease-in-out infinite',
              }}
            >
              Loading 3D…
              <style jsx>{`
                @keyframes lobbyAvatarPulse {
                  0%, 100% { opacity: 0.55; }
                  50% { opacity: 0.85; }
                }
              `}</style>
            </div>
          )}
          <model-viewer
            ref={viewerRef}
            src={MODEL_URL}
            alt="3D Zobu avatar — drag to rotate"
            tabIndex={-1}
            camera-controls
            disable-zoom
            disable-pan
            interaction-prompt="none"
            camera-orbit="0deg 80deg 3m"
            min-camera-orbit="auto 80deg auto"
            max-camera-orbit="auto 80deg auto"
            shadow-intensity="0.4"
            exposure="1.05"
            loading="eager"
            reveal="auto"
            {...motionAttrs}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              // model-viewer now receives pointer drags for rotation; the
              // wrapper still gets pointerdown/up via event bubbling for
              // tap-vs-drag flip detection.
              opacity: ready ? 1 : 0,
              transition: 'opacity 240ms ease-out',
              touchAction: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
