import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

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

  // Only autoplay the GLB's baked idle animation. Camera stays fixed — the
  // model's own motion is what the user should see.
  const motionAttrs = reducedMotion ? {} : ({ autoplay: true } as const);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Switch to card view"
      onClick={onClick}
      onKeyDown={handleKey}
      className="relative cursor-pointer"
      style={{
        width: FOOTPRINT_WIDTH,
        height: FOOTPRINT_HEIGHT,
        background: 'transparent',
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
            alt="3D Zobu avatar"
            tabIndex={-1}
            disable-zoom
            camera-orbit="0deg 80deg 3m"
            shadow-intensity="0.4"
            exposure="1.05"
            loading="eager"
            reveal="auto"
            {...motionAttrs}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              // Let clicks pass through to the wrapper so flipping back works.
              pointerEvents: 'none',
              opacity: ready ? 1 : 0,
              transition: 'opacity 240ms ease-out',
            }}
          />
        </>
      )}
    </div>
  );
}
