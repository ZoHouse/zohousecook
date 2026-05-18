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
 * One-shot vs loop:
 *  - `playKitchenAlert()` plays the cue PLAY_COUNT times once (used by the
 *    "Test sound" button).
 *  - `startKitchenAlertLoop()` / `stopKitchenAlertLoop()` pulse the cue with
 *    a short gap until explicitly stopped — used while any order is sitting
 *    in `kitchen_status='new'` (i.e. arrived but not yet accepted).
 */

const PLAY_COUNT = 2
const VOLUME = 1.0
const DEBOUNCE_MS = 800
const LOOP_GAP_MS = 1500

let audioUrl: string | null = null
let primer: HTMLAudioElement | null = null
let unlocked = false
let lastBeepAt = 0

let loopActive = false
let loopTimer: number | null = null
let loopAudio: HTMLAudioElement | null = null

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

/**
 * Pulse the alert cue until `stopKitchenAlertLoop()` is called. Used while
 * orders sit in `kitchen_status='new'`. Idempotent — calling start when
 * already looping is a no-op.
 */
export function startKitchenAlertLoop(): void {
  if (typeof window === 'undefined') return
  if (!audioUrl) return
  if (loopActive) return
  loopActive = true

  const playCycle = () => {
    if (!loopActive || !audioUrl) return
    loopAudio = new Audio(audioUrl)
    loopAudio.volume = VOLUME
    loopAudio.addEventListener(
      'ended',
      () => {
        if (!loopActive) return
        loopTimer = window.setTimeout(playCycle, LOOP_GAP_MS)
      },
      { once: true },
    )
    loopAudio.play().catch(() => {
      // Playback blocked (probably audio not unlocked yet). Try again after
      // the gap; once the user interacts with the page it'll start ringing.
      if (!loopActive) return
      loopTimer = window.setTimeout(playCycle, LOOP_GAP_MS * 2)
    })
  }
  playCycle()
}

export function stopKitchenAlertLoop(): void {
  loopActive = false
  if (loopTimer !== null) {
    clearTimeout(loopTimer)
    loopTimer = null
  }
  if (loopAudio) {
    try {
      loopAudio.pause()
      loopAudio.currentTime = 0
    } catch {
      /* element might have been GC'd */
    }
    loopAudio = null
  }
}

export function isKitchenAlertLooping(): boolean {
  return loopActive
}
