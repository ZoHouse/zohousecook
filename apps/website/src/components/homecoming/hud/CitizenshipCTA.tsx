// apps/website/src/components/homecoming/hud/CitizenshipCTA.tsx
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useCeremonyProgress } from '../state/useCeremonyProgress'
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'
import { completeHomecoming } from '../../../lib/homecoming/endpoints'
import { buildHandleHome } from '../constants'

type Props = { handle: string; replay: boolean }

export function CitizenshipCTA({ handle, replay }: Props) {
  const router = useRouter()
  const t = useCeremonyProgress((s) => s.tLerp)
  const fireCTA = useCeremonyInteraction((s) => s.fireCTA)
  const [busy, setBusy] = useState(false)

  const show = t >= 0.95
  const opacity = Math.min(1, Math.max(0, (t - 0.95) / 0.04))
  const destination = buildHandleHome(handle)

  const onClick = async () => {
    if (busy) return
    setBusy(true)
    fireCTA()
    // Lock scroll so the user doesn't overshoot while we transition.
    document.body.style.overflow = 'hidden'
    // Write homecoming_completed_at unless this is a replay (?replay=1 or ?preview=1).
    // Server-side this is idempotent, but we skip the write for replay so preview/
    // debug sessions do not flip the one-time flag.
    if (!replay) {
      try {
        await completeHomecoming()
      } catch {
        // Completion failure is not fatal for navigation — the next /homecoming
        // request will re-run the SSR gate and either redirect or retry.
      }
    }
    router.push(destination)
  }

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        padding: '16px 36px',
        fontFamily: 'monospace',
        fontSize: 14,
        letterSpacing: 3,
        color: '#1c1008',
        background: '#ffd9a8',
        border: 'none',
        cursor: show ? 'pointer' : 'default',
        opacity,
        pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity 300ms, transform 300ms',
        textTransform: 'uppercase',
      }}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      disabled={busy}
    >
      Become a citizen
    </button>
  )
}
