// apps/website/src/components/homecoming/hooks/useDeviceTier.ts
import { useEffect, useState } from 'react'
import { getGPUTier } from 'detect-gpu'

export type DeviceTier = 0 | 1 | 2 | 3  // 0 = unknown/low, 3 = high

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(0)
  useEffect(() => {
    let cancelled = false
    getGPUTier().then((r) => {
      if (cancelled) return
      // r.tier is 0-3 from detect-gpu; treat 0/unknown as tier 1 (spec §6)
      const t = (r.tier === 0 ? 1 : r.tier) as DeviceTier
      setTier(t)
    }).catch(() => setTier(1))
    return () => { cancelled = true }
  }, [])
  return tier
}

/** Parse `?debug=1` and `?t=<float>` from window.location. Returns null if not present. */
export function readDebugParams(): { debug: boolean; t: number | null } {
  if (typeof window === 'undefined') return { debug: false, t: null }
  const p = new URLSearchParams(window.location.search)
  const debug = p.get('debug') === '1'
  const tRaw = p.get('t')
  const t = tRaw !== null && !Number.isNaN(parseFloat(tRaw))
    ? Math.max(0, Math.min(1, parseFloat(tRaw)))
    : null
  return { debug, t }
}
