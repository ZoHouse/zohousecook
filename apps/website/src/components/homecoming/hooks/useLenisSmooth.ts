// apps/website/src/components/homecoming/hooks/useLenisSmooth.ts
import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'

type Options = { enabled?: boolean }

/**
 * Installs Lenis smooth-scroll for the Homecoming ceremony. Native scroll is
 * retained underneath (scrollY still reflects the smoothed position), so the
 * existing useScrollListener receives interpolated values instead of the
 * raw wheel deltas. Scoped to the Ceremony component — destroyed on unmount.
 */
export function useLenisSmooth({ enabled = true }: Options = {}) {
  useEffect(() => {
    if (!enabled) return
    // Tuned for desktop wheel: short duration + near-linear easing so the
    // camera rig (damped at DAMPING_LAMBDA=14) is the dominant smoothing
    // layer rather than stacking on top of a slow Lenis tween. 1.0 wheel
    // multiplier keeps the gesture → scroll distance ratio native-feeling.
    const lenis = new Lenis({
      duration: 0.45,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),  // ease-out cubic
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [enabled])
}
