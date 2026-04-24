// apps/website/src/components/homecoming/constants.ts
// See spec §5 (Named constants) for rationale.

export const SCROLL_SPACER_VH = 600  // total scroll distance; governs t sensitivity

/**
 * Post-ceremony destination. /@handle is rewritten by Next to /passport
 * in apps/website/next.config.js (subroutes like /@:handle/earnings do append
 * ?handle=:handle, but the base route does not). The passport page infers
 * the viewer's handle from auth / pathname.
 */
export function buildHandleHome(handle: string): string {
  return `/@${handle}`
}

// Redirect targets used by SSR on auth/identity/one-time/error paths.
export const REDIRECT_AUTH = '/zo-auth?next=/homecoming'
export const REDIRECT_ONBOARDING = '/onboarding?next=/homecoming'
// Completion & failsafe redirects use buildHandleHome(handle) above.

export const INTRO_PHASE_B_MS = 1400   // wireframe hold
export const INTRO_PHASE_C_MS = 1500   // materialization + camera pan
export const INTRO_SKIP_COMPRESS_MS = 300  // fast-forward duration on user intent

export const DAMPING_LAMBDA = 8  // damp() smoothing for tLerp

export const CHROME_STONE_PULSE_BASELINE = 0.25
export const CHROME_STONE_PULSE_AMPLITUDE = 0.75
export const CHROME_STONE_PULSE_FREQ_HZ = 0.6  // at rest
export const CHROME_STONE_PULSE_FREQ_HZ_HOVERED = 1.6

export const LOAD_TIMEOUT_MS = 10_000  // spec §6: fall back if assets don't load in 10s
// Backend endpoint path used by SSR. The client-side helper in
// lib/homecoming/endpoints.ts owns the complete/ URL literal — no need to
// duplicate here.
export const HOMECOMING_ENDPOINT = '/api/v1/passport/homecoming/'
