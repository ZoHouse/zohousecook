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

    // Disable browser scroll restoration so that navigating back to the
    // ceremony after scrolling away does not rehydrate a stale scrollY.
    // The ceremony is a one-time sequence — always start at t=0.
    const prevRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

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

    // NOTE: do NOT call lenis.scrollTo(0, { immediate: true }) here.
    // Certain Lenis versions treat that as a locked target that clamps
    // subsequent wheel deltas to the max-scroll edge. The window.scrollTo
    // above is sufficient to reset position without breaking input.

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      window.history.scrollRestoration = prevRestoration
    }
  }, [enabled])
}
