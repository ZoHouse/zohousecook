// apps/website/src/components/homecoming/hooks/useLoadTimeout.ts
import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { LOAD_TIMEOUT_MS } from '../constants'

/**
 * Returns true if drei's loader has been "still loading" for LOAD_TIMEOUT_MS
 * since mount. Consumers flip the fallback path on. Pass `active = false`
 * to skip (e.g., when fallback is already decided for other reasons).
 */
export function useLoadTimeout(active: boolean): boolean {
  const [timedOut, setTimedOut] = useState(false)
  const active$ = useProgress((s) => s.active)
  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => {
      if (active$) setTimedOut(true)
    }, LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [active, active$])
  return timedOut
}
