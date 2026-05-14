/**
 * Kitchen alert — plays an audio cue when a new order lands on the kitchen
 * board. Helps chefs notice incoming work without staring at the screen.
 *
 * Browser autoplay policy: an HTMLAudioElement cannot play until a real
 * user gesture has occurred. `unlockKitchenAudio` primes a shared element
 * inside the first pointerdown/keydown on the kitchen page; once unlocked,
 * subsequent plays succeed.
 *
 * `setKitchenAudioUrl` is intentionally split from unlock so the asset URL
 * survives HMR / route changes — module-level state resets on hot reload,
 * so we re-set the URL from the kitchen page's useEffect on every mount.
 *
 * On each new order we play the cue PLAY_COUNT times back-to-back at max
 * volume so it cuts through cafe noise.
 */

const PLAY_COUNT = 2
const VOLUME = 1.0
const DEBOUNCE_MS = 800

let audioUrl: string | null = null
let primer: HTMLAudioElement | null = null
let unlocked = false
let lastBeepAt = 0

export function setKitchenAudioUrl(url: string): void {
  audioUrl = url
}

/**
 * Primes a shared Audio element on the user gesture. Must be called from
 * inside a real pointerdown/keydown/click handler — browsers only honor
 * the first .play() that runs inside that gesture window.
 */
export function unlockKitchenAudio(): void {
  if (typeof window === 'undefined') return
  if (!audioUrl) return
  if (!primer || primer.src.indexOf(audioUrl) === -1) {
    primer = new Audio(audioUrl)
    primer.preload = 'auto'
  }
  primer.volume = 0
  primer
    .play()
    .then(() => {
      primer?.pause()
      if (primer) primer.currentTime = 0
      unlocked = true
    })
    .catch(() => { /* gesture window missed — next interaction will retry */ })
}

export function isKitchenAudioUnlocked(): boolean {
  return unlocked
}

export function playKitchenAlert(): void {
  if (typeof window === 'undefined') return
  if (!audioUrl) return

  // Debounce: don't restart the cue if multiple orders arrive in a burst.
  const now = Date.now()
  if (now - lastBeepAt < DEBOUNCE_MS) return
  lastBeepAt = now

  let count = 0
  const playOnce = () => {
    if (count >= PLAY_COUNT) return
    count++
    const a = new Audio(audioUrl as string)
    a.volume = VOLUME
    a.addEventListener('ended', playOnce, { once: true })
    a.play().catch(() => {
      // Silent fail — playback may be blocked until next gesture; missing a
      // beep is better than a JS error in the kitchen.
    })
  }
  playOnce()
}
