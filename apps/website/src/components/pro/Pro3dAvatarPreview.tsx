import { useEffect, useRef, useState } from 'react';

// Webpack emits this as /_next/static/media/zobu_bro.<hash>.glb via the
// asset/resource rule in apps/website/next.config.js.
import MODEL_URL from '../../assets/3d/zobu_bro.glb';

export default function Pro3dAvatarPreview() {
  const ref = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState(false);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Registers the <model-viewer> custom element on mount.
    // Dynamic import keeps model-viewer out of the main chunk.
    import('@google/model-viewer').catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onError = () => setFailed(true);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('error', onError);
    };
  }, []);

  if (failed) return null;

  const motionAttrs = reducedMotion
    ? {}
    : ({ 'auto-rotate': true, autoplay: true } as const);

  return (
    <div className="relative w-full aspect-[3/4] max-h-[60vh] mb-4 rounded-xl overflow-hidden bg-black/40">
      <model-viewer
        ref={ref as React.RefObject<HTMLElement>}
        src={MODEL_URL}
        alt="Base Zobu 3D avatar"
        tabIndex={-1}
        camera-controls
        disable-zoom
        camera-orbit="0deg 80deg 3m"
        rotation-per-second="15deg"
        shadow-intensity="0.6"
        exposure="1.0"
        loading="eager"
        reveal="auto"
        {...motionAttrs}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  );
}
