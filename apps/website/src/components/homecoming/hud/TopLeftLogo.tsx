// apps/website/src/components/homecoming/hud/TopLeftLogo.tsx
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { ZONES } from '../spine/zones'

export function TopLeftLogo() {
  const t = useCeremonyProgress((s) => s.tLerp)
  const opacity =
    t < ZONES.chamberReveal[0]
      ? 1
      : Math.max(0, 1 - (t - ZONES.chamberReveal[0]) / 0.1)
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: 20,
        pointerEvents: 'none',
        fontFamily: 'monospace',
        fontSize: 14,
        letterSpacing: 2,
        color: '#ffd9a8',
        opacity,
        transition: 'opacity 300ms',
      }}
      aria-hidden
    >
      {'\\z/'}
    </div>
  )
}
