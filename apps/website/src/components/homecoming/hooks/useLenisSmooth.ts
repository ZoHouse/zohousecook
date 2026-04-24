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
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
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
