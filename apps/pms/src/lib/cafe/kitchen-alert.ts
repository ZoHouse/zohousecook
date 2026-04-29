/**
 * Kitchen alert — short audible beep + (optional) tab-title flash when a
 * new order lands on the kitchen board. Helps chefs notice incoming work
 * without staring at the screen.
 *
 * Audio is synthesized via the Web Audio API (no asset round-trip, no
 * 404 risk on stale CDN). Two short beeps at 880 Hz / 1320 Hz so it cuts
 * through cafe noise without being annoying.
 *
 * Browser autoplay policy note: most browsers block AudioContext until the
 * user has interacted with the page at least once. The chef's first click
 * (anywhere on /pm/cafe/kitchen) unlocks audio for subsequent beeps. The
 * first incoming order before any interaction may be silent — that's a
 * platform constraint we document rather than work around.
 */

let lastBeepAt = 0

export function playKitchenAlert() {
  if (typeof window === 'undefined') return

  // Debounce: don't fire more than once per 800ms even if multiple orders
  // arrive in a burst (unusual, but keeps the speakers from gatling).
  const now = Date.now()
  if (now - lastBeepAt < 800) return
  lastBeepAt = now

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()

    const playTone = (freq: number, startSec: number, durSec: number, peak = 0.25) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + startSec
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec)
      osc.start(t0)
      osc.stop(t0 + durSec + 0.05)
    }

    playTone(880, 0, 0.18)
    playTone(1320, 0.22, 0.28, 0.22)

    // Close the context after the second tone finishes to free resources.
    setTimeout(() => {
      try { ctx.close() } catch { /* noop */ }
    }, 800)
  } catch {
    // Silent fail — a missing beep is better than a JS error in the kitchen.
  }
}
