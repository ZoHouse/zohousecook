// apps/website/src/components/homecoming/hooks/useScrollListener.ts
import { useEffect } from 'react'
import { useCeremonyProgress } from '../state/useCeremonyProgress'

type Options = { enabled?: boolean }

/**
 * Attaches a passive scroll listener that writes normalized t to the store.
 * When `enabled` is false, the listener is skipped — used so the fallback
 * path doesn't install global scroll handlers.
 */
export function useScrollListener(
  spacerRef: React.RefObject<HTMLElement>,
  { enabled = true }: Options = {},
) {
  useEffect(() => {
    if (!enabled) return
    const onScroll = () => {
      const el = spacerRef.current
      if (!el) return
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const raw = window.scrollY / scrollable
      const clamped = Math.max(0, Math.min(1, raw))
      useCeremonyProgress.getState().setT(clamped)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()  // prime on mount
    return () => window.removeEventListener('scroll', onScroll)
  }, [spacerRef, enabled])
}
