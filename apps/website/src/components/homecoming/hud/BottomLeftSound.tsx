// apps/website/src/components/homecoming/hud/BottomLeftSound.tsx
import { useCeremonyInteraction } from '../state/useCeremonyInteraction'

export function BottomLeftSound() {
  const audioEnabled = useCeremonyInteraction((s) => s.audioEnabled)
  const toggleAudio = useCeremonyInteraction((s) => s.toggleAudio)
  return (
    <button
      onClick={toggleAudio}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 20,
        background: 'transparent',
        border: 'none',
        color: '#ffd9a8',
        fontFamily: 'monospace',
        fontSize: 12,
        cursor: 'pointer',
        letterSpacing: 1,
      }}
      aria-label={audioEnabled ? 'Mute audio' : 'Enable audio'}
    >
      sound: {audioEnabled ? 'on' : 'off'}
    </button>
  )
}
