/**
 * Kitchen alert — plays an audio cue when a new order lands on the kitchen
 * board. Helps chefs notice incoming work without staring at the screen,
 * including when the kitchen tab is in the background.
 *
 * Why Web Audio over HTMLAudioElement: a transient `new Audio()` element
 * created in a background tab can be paused / GC'd by the browser before
 * .play() resolves, and Chrome's media throttling can mute element-based
 * playback once the tab loses focus. An AudioContext, once unlocked by a
 * user gesture, keeps producing sound across background tabs — provided we
 * resume() it before each play, because the browser may slide it into the
 * 'suspended' state during idle periods.
 *
 * Flow:
 *   setKitchenAudioUrl(url)   ← called on mount (survives HMR)
 *   unlockKitchenAudio()      ← inside first pointerdown/keydown:
 *                                 creates AudioContext, kicks off decode,
 *                                 primes an HTMLAudio fallback element
 *   playKitchenAlert()        ← on each new order: resume() the context,
 *                                 play decoded buffer PLAY_COUNT times.
 *                                 Falls back to HTMLAudio if Web Audio is
 *                                 unavailable (e.g. codec decode failed).
 *
 * The HTMLAudio fallback uses a module-level pool so element references
 * survive across plays (transient elements get cleaned up in hidden tabs).
 */

const PLAY_COUNT = 2
const VOLUME = 1.0
const DEBOUNCE_MS = 800

let audioUrl: string | null = null
let unlocked = false
let lastBeepAt = 0

let audioCtx: AudioContext | null = null
let decodedBuffer: AudioBuffer | null = null
let bufferLoading = false
let visibilityWired = false

let fallbackPool: HTMLAudioElement[] = []
const FALLBACK_POOL_SIZE = 2

export function setKitchenAudioUrl(url: string): void {
  if (audioUrl === url) return
  audioUrl = url
  decodedBuffer = null
  fallbackPool = []
}

async function ensureBuffer(): Promise<void> {
  if (!audioUrl || !audioCtx) return
  if (decodedBuffer || bufferLoading) return
  bufferLoading = true
  try {
    const res = await fetch(audioUrl)
    const arr = await res.arrayBuffer()
    decodedBuffer = await audioCtx.decodeAudioData(arr)
  } catch {
    // Decode failed (e.g. webm on Safari). Leave decodedBuffer null so
    // playKitchenAlert routes through the HTMLAudio fallback instead.
    decodedBuffer = null
  } finally {
    bufferLoading = false
  }
}

function wireVisibilityResume(): void {
  if (visibilityWired) return
  if (typeof document === 'undefined') return
  visibilityWired = true
  // Chrome can auto-suspend an AudioContext when its tab goes idle. Resuming
  // on visibilitychange isn't enough on its own — playKitchenAlert also
  // resumes — but doing it here keeps the context warm if the tab swings
  // back into focus between alerts.
  document.addEventListener('visibilitychange', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { /* best effort */ })
    }
  })
}

/**
 * Primes the audio pipeline on a user gesture. Must be called from inside a
 * real pointerdown/keydown/click handler — browsers only honor the first
 * AudioContext creation / .play() that runs inside that gesture window.
 */
export function unlockKitchenAudio(): void {
  if (typeof window === 'undefined') return
  if (!audioUrl) return

  if (!audioCtx) {
    const Ctor: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext
    if (Ctor) {
      try { audioCtx = new Ctor() } catch { audioCtx = null }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { /* will retry on next gesture */ })
  }
  void ensureBuffer()
  wireVisibilityResume()

  // HTMLAudio fallback: keep a pool of long-lived elements so they don't get
  // GC'd between plays in a hidden tab, and prime one silently so the
  // element-level autoplay gate is open too.
  if (fallbackPool.length === 0) {
    for (let i = 0; i < FALLBACK_POOL_SIZE; i++) {
      const el = new Audio(audioUrl)
      el.preload = 'auto'
      fallbackPool.push(el)
    }
  }
  const primer = fallbackPool[0]
  primer.volume = 0
  primer
    .play()
    .then(() => {
      primer.pause()
      primer.currentTime = 0
      primer.volume = VOLUME
      unlocked = true
    })
    .catch(() => { /* gesture window missed — next interaction will retry */ })

  if (audioCtx && audioCtx.state === 'running') unlocked = true
}

export function isKitchenAudioUnlocked(): boolean {
  return unlocked
}

function playViaWebAudio(): boolean {
  if (!audioCtx) return false
  if (!decodedBuffer) {
    void ensureBuffer()
    return false
  }
  let count = 0
  const playOnce = () => {
    if (count >= PLAY_COUNT) return
    if (!audioCtx || !decodedBuffer) return
    count++
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { /* best effort */ })
    }
    const src = audioCtx.createBufferSource()
    src.buffer = decodedBuffer
    const gain = audioCtx.createGain()
    gain.gain.value = VOLUME
    src.connect(gain)
    gain.connect(audioCtx.destination)
    src.onended = playOnce
    try { src.start(0) } catch { /* context closed — give up this cycle */ }
  }
  playOnce()
  return true
}

function playViaHtmlAudio(): void {
  if (!audioUrl) return
  if (fallbackPool.length === 0) {
    for (let i = 0; i < FALLBACK_POOL_SIZE; i++) {
      const el = new Audio(audioUrl)
      el.preload = 'auto'
      fallbackPool.push(el)
    }
  }
  let idx = 0
  let count = 0
  const playOnce = () => {
    if (count >= PLAY_COUNT) return
    count++
    const el = fallbackPool[idx % fallbackPool.length]
    idx++
    el.currentTime = 0
    el.volume = VOLUME
    const onEnded = () => {
      el.removeEventListener('ended', onEnded)
      playOnce()
    }
    el.addEventListener('ended', onEnded)
    el.play().catch(() => {
      el.removeEventListener('ended', onEnded)
    })
  }
  playOnce()
}

export function playKitchenAlert(): void {
  if (typeof window === 'undefined') return
  if (!audioUrl) return

  // Debounce: don't restart the cue if multiple orders arrive in a burst.
  const now = Date.now()
  if (now - lastBeepAt < DEBOUNCE_MS) return
  lastBeepAt = now

  // Resume first — a suspended AudioContext silently drops any source you
  // try to start on it. This is what makes background-tab playback work.
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { /* best effort */ })
  }
  if (playViaWebAudio()) return
  playViaHtmlAudio()
}

// Loop API — rings on an interval until explicitly stopped. Used by the
// kitchen board to keep nagging chefs while an unaccepted order is sitting.
const LOOP_INTERVAL_MS = 5000
let loopHandle: ReturnType<typeof setInterval> | null = null

export function startKitchenAlertLoop(): void {
  if (typeof window === 'undefined') return
  if (loopHandle != null) return
  // Force first beep through the debounce so the loop is immediately audible
  // even if a one-shot playKitchenAlert() just fired moments earlier.
  lastBeepAt = 0
  playKitchenAlert()
  loopHandle = setInterval(() => { playKitchenAlert() }, LOOP_INTERVAL_MS)
}

export function stopKitchenAlertLoop(): void {
  if (loopHandle == null) return
  clearInterval(loopHandle)
  loopHandle = null
}

export function isKitchenAlertLooping(): boolean {
  return loopHandle != null
}
