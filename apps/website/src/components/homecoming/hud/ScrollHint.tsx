// apps/website/src/components/homecoming/hud/ScrollHint.tsx
// The bounce keyframe is inlined via a <style> tag — the website app does
// not currently have a global stylesheet entrypoint we can append to
// without touching other teams.
import { useCeremonyProgress } from '../state/useCeremonyProgress'

const BOUNCE_KEYFRAME = `
@keyframes homecoming-scrollhint-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(6px); }
}`

export function ScrollHint() {
  const t = useCeremonyProgress((s) => s.tLerp)
  const introDone = useCeremonyProgress((s) => s.introDone)
  if (!introDone || t > 0.03) return null
  return (
    <>
      <style>{BOUNCE_KEYFRAME}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          color: '#ffd9a8',
          fontFamily: 'monospace',
          fontSize: 12,
          opacity: 0.7,
          letterSpacing: 2,
          animation: 'homecoming-scrollhint-bounce 1.8s infinite ease-in-out',
        }}
        aria-hidden
      >
        scroll ↓
      </div>
    </>
  )
}
