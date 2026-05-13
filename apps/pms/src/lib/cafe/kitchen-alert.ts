/**
 * Kitchen alert — short audible beep when a new order lands on the kitchen
 * board. Helps chefs notice incoming work without staring at the screen.
 *
 * Audio is synthesized via the Web Audio API (no asset round-trip, no
 * 404 risk on stale CDN). Two short beeps at 880 Hz / 1320 Hz so it cuts
 * through cafe noise without being annoying.
 *
 * Browser autoplay policy: AudioContext starts in 'suspended' state until
 * a user gesture resumes it. We use a single shared context (not a fresh
 * one per beep, which would re-suspend) and call resume() inside
 * `unlockKitchenAudio` from a real click/keydown on the kitchen page.
 * Until that first gesture, beeps are buffered as no-ops; once unlocked,
 * every subsequent INSERT plays reliably even hours later.
 */

let ctx: AudioContext | null = null
let unlocked = false
let lastBeepAt = 0

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  try {
    ctx = new AudioCtx()
    return ctx
  } catch {
    return null
  }
}

/**
 * Resumes the shared AudioContext. Must be called from inside a user-
 * gesture event handler (pointerdown/keydown/click) — that's the only
 * moment the browser will honor resume(). After this fires once, beeps
 * play freely for the lifetime of the page.
 */
export function unlockKitchenAudio(): void {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    c.resume().catch(() => { /* noop */ })
  }
  // Prime the graph with a silent oscillator — iOS Safari needs an actual
  // node to play inside the gesture window before it considers the context
  // unlocked.
  try {
    const osc = c.createOscillator()
    const gain = c.createGain()
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.01)
  } catch { /* noop */ }
  unlocked = true
}

export function isKitchenAudioUnlocked(): boolean {
  return unlocked && ctx?.state === 'running'
}

export function playKitchenAlert(): void {
  if (typeof window === 'undefined') return

  // Debounce: don't fire more than once per 800ms even if multiple orders
  // arrive in a burst (unusual, but keeps the speakers from gatling).
  const now = Date.now()
  if (now - lastBeepAt < 800) return
  lastBeepAt = now

  const c = getCtx()
  if (!c) return

  // Best-effort resume in case the tab was backgrounded or never unlocked.
  // Resume outside a gesture is a no-op in strict browsers; that's fine —
  // the next chef interaction will catch it.
  if (c.state === 'suspended') {
    c.resume().catch(() => { /* noop */ })
  }

  try {
    const playTone = (freq: number, startSec: number, durSec: number, peak = 0.25) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = c.currentTime + startSec
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec)
      osc.start(t0)
      osc.stop(t0 + durSec + 0.05)
    }

    playTone(880, 0, 0.18)
    playTone(1320, 0.22, 0.28, 0.22)
  } catch {
    // Silent fail — a missing beep is better than a JS error in the kitchen.
  }
}
