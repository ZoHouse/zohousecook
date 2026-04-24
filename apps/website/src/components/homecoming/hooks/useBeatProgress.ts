// apps/website/src/components/homecoming/hooks/useBeatProgress.ts
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { beatProgress, type Zone } from '../spine/zones'

/**
 * Read a smoothed beat progress value without causing React re-renders.
 * Callers use this inside useFrame so zustand is subscribed imperatively.
 */
export function readBeatProgress(zone: Zone): number {
  return beatProgress(useCeremonyProgress.getState().tLerp, zone)
}

/** React-subscribed variant for HUD/CTA that need to re-render on zone entry. */
export function useBeatProgress(zone: Zone): number {
  return useCeremonyProgress((s) => beatProgress(s.tLerp, zone))
}
