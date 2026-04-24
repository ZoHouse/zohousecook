// apps/website/src/components/homecoming/hooks/useIntroTimeline.ts
import { useEffect, useRef } from 'react'
import { useProgress } from '@react-three/drei'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import {
  INTRO_PHASE_B_MS,
  INTRO_PHASE_C_MS,
  INTRO_SKIP_COMPRESS_MS,
} from '../constants'

type Options = { enabled?: boolean }

/**
 * Runs on mount before scroll is live:
 *   Phase A: wait for drei useProgress loaded === true
 *   Phase B: hold wireframe for INTRO_PHASE_B_MS
 *   Phase C: tween uMaterialization 0 → 1 over INTRO_PHASE_C_MS
 *   Phase D: setIntroDone(true)
 *
 * Listens at window for wheel/touchmove intent to fast-forward
 * (overflow: hidden on body prevents actual scroll; we watch intent).
 *
 * When `enabled` is false (fallback path), all effects no-op so the overflow
 * lock never gets installed on devices that are supposed to see the static
 * poster.
 */
export function useIntroTimeline({ enabled = true }: Options = {}) {
  const loaded = useProgress((s) => s.loaded > 0 && s.active === false)
  const rafRef = useRef<number | null>(null)
  const skipRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const onIntent = () => { skipRef.current = true }
    window.addEventListener('wheel', onIntent, { passive: true })
    window.addEventListener('touchmove', onIntent, { passive: true })
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('wheel', onIntent)
      window.removeEventListener('touchmove', onIntent)
      // Restore scroll if we unmount before intro finished (e.g., nav away).
      document.body.style.overflow = ''
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !loaded) return

    const startB = performance.now()
    const phaseBMs = () => (skipRef.current ? INTRO_SKIP_COMPRESS_MS * 0.3 : INTRO_PHASE_B_MS)
    const phaseCMs = () => (skipRef.current ? INTRO_SKIP_COMPRESS_MS * 0.7 : INTRO_PHASE_C_MS)

    const tick = (now: number) => {
      const { setMaterialization, setIntroDone } = useCeremonyProgress.getState()
      const elapsed = now - startB
      const bEnd = phaseBMs()
      const cEnd = bEnd + phaseCMs()

      if (elapsed < bEnd) {
        setMaterialization(0)
      } else if (elapsed < cEnd) {
        const u = (elapsed - bEnd) / phaseCMs()
        // ease-out cubic
        const eased = 1 - Math.pow(1 - u, 3)
        setMaterialization(eased)
      } else {
        setMaterialization(1)
        setIntroDone()
        document.body.style.overflow = ''
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [loaded, enabled])
}
