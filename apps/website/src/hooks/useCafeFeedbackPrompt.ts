import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'
import type { CafeOrderWithItems } from '../components/cafezomad/types'

// ─────────────────────────────────────────────────────────────────────────────
// Surfaces the *next* served-but-unrated order for the current customer so
// the cafezomad shell can auto-pop the feedback modal.
//
// Skip is a per-device dismissal (localStorage) — we don't write a "skipped"
// row to the DB because that would conflict with the UNIQUE(order_id)
// constraint if the user later changes their mind and rates the order. The
// absence-of-row model also keeps the operator-facing reviews page free of
// "user didn't care" noise.
//
// `served` is the only status this hook considers. Cancelled orders are
// uninteresting for feedback; ready→served transitions handled inside the
// kitchen are the trigger point.
// ─────────────────────────────────────────────────────────────────────────────

const SKIP_KEY_PREFIX = 'cafezomad:feedback:dismissed:'
const FEEDBACK_LOOKBACK_DAYS = 14

function isDismissed(orderId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SKIP_KEY_PREFIX + orderId) === '1'
  } catch {
    return false
  }
}

function markDismissed(orderId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SKIP_KEY_PREFIX + orderId, '1')
  } catch {
    /* localStorage unavailable (private mode, quota) — fine, in-memory state
       still suppresses the modal for this session. */
  }
}

export interface CafeFeedbackPromptState {
  pendingOrder: CafeOrderWithItems | null
  dismiss: (orderId: string) => void
  markRated: (orderId: string) => void
}

export function useCafeFeedbackPrompt(
  orders: CafeOrderWithItems[],
  zoUserId: string | null | undefined,
): CafeFeedbackPromptState {
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
  const [dismissedTick, setDismissedTick] = useState(0)

  // Served orders within the lookback window, oldest skipped first via reverse —
  // we want the *most recent* served order to be the one we prompt for.
  const candidateOrders = useMemo(() => {
    const cutoff = Date.now() - FEEDBACK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
    return orders.filter((o) => {
      if (o.kitchen_status !== 'served') return false
      if (!o.zo_user_id) return false
      if (zoUserId && o.zo_user_id !== zoUserId) return false
      const created = new Date(o.created_at).getTime()
      if (!Number.isFinite(created) || created < cutoff) return false
      return true
    })
  }, [orders, zoUserId])

  // Pull rated order ids in one shot for the candidate window. Re-runs when
  // the candidate set changes (new served order arriving, or user switches
  // accounts). We don't subscribe — the customer just submitted feedback if
  // we're going to skip them, and markRated handles the same-session case.
  useEffect(() => {
    if (candidateOrders.length === 0) {
      setRatedIds(new Set())
      return
    }
    let cancelled = false
    const ids = candidateOrders.map((o) => o.id)
    supabase
      .from('cafe_order_feedback')
      .select('order_id')
      .in('order_id', ids)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('useCafeFeedbackPrompt: rated-ids fetch failed', error)
          return
        }
        setRatedIds(new Set((data || []).map((r) => r.order_id as string)))
      })
    return () => {
      cancelled = true
    }
  }, [candidateOrders])

  const pendingOrder = useMemo(() => {
    // Surface the *most recent* unrated served order. Older ones get a chance
    // next session if the user skips this one.
    for (const o of candidateOrders) {
      if (ratedIds.has(o.id)) continue
      if (isDismissed(o.id)) continue
      return o
    }
    return null
    // dismissedTick re-runs the memo after a dismiss() so the next candidate
    // (or null) is surfaced without waiting for an unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateOrders, ratedIds, dismissedTick])

  const dismiss = useCallback((orderId: string) => {
    markDismissed(orderId)
    setDismissedTick((t) => t + 1)
  }, [])

  const markRated = useCallback((orderId: string) => {
    setRatedIds((prev) => {
      if (prev.has(orderId)) return prev
      const next = new Set(prev)
      next.add(orderId)
      return next
    })
    // Belt-and-suspenders: also dismiss so a stale poll doesn't bring the
    // modal back before the rated-ids fetch refreshes.
    markDismissed(orderId)
  }, [])

  return { pendingOrder, dismiss, markRated }
}
