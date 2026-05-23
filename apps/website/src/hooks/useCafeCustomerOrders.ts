import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { CafeOrderWithItems } from '../components/cafezomad/types'

// ─────────────────────────────────────────────────────────────────────────────
// Customer "My Orders" feed for Cafe Zomad
//
// Replaces the inline fetch/setInterval that hard-capped at 20 rows and had
// no way to scroll further back. Paginates 10/page with Load More while
// keeping the existing 5s visibility-aware polling so active-order status
// changes and Razorpay payment_status flips still propagate.
//
// Scoped to the logged-in user (zo_user_id). Property filter is preserved so
// staff toggling between BLR/WTF doesn't see cross-cafe history; cross-cafe
// history needs a separate "all my orders" view.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10
const POLL_INTERVAL_MS = 5000
const TERMINAL_STATUSES = new Set(['ready', 'served', 'cancelled'])

interface UseCafeCustomerOrdersParams {
  zoUserId: string | null | undefined
  propertyId: string | null
}

interface UseCafeCustomerOrdersResult {
  orders: CafeOrderWithItems[]
  totalCount: number
  isLoading: boolean
  hasMore: boolean
  loadMore: () => void
  refetch: () => Promise<void>
  // Push an order placed locally so it shows in the list before the next poll.
  appendLocalOrder: (order: CafeOrderWithItems) => void
}

export function useCafeCustomerOrders({
  zoUserId,
  propertyId,
}: UseCafeCustomerOrdersParams): UseCafeCustomerOrdersResult {
  const [orders, setOrders] = useState<CafeOrderWithItems[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadedPages, setLoadedPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Capture latest values inside the visibility handler so we don't re-subscribe
  // on every state change.
  const ctxRef = useRef({ zoUserId, propertyId, loadedPages })
  ctxRef.current = { zoUserId, propertyId, loadedPages }

  const fetchOrders = useCallback(
    async (pages: number) => {
      if (!zoUserId || !propertyId) {
        setOrders([])
        setTotalCount(0)
        return
      }
      setIsLoading(true)
      try {
        const to = pages * PAGE_SIZE - 1
        const { data, count, error } = await supabase
          .from('cafe_orders')
          .select('*, order_items:cafe_order_items(*)', { count: 'exact' })
          .eq('zo_user_id', zoUserId)
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .range(0, to)
        if (error) throw error
        const next = (data || []).map((o) => ({
          ...o,
          order_items: (o as { order_items?: unknown[] }).order_items || [],
        })) as CafeOrderWithItems[]
        setOrders(next)
        setTotalCount(count ?? 0)
      } catch (err) {
        console.error('useCafeCustomerOrders fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [zoUserId, propertyId],
  )

  // Initial + on-login + on-loadMore + on-property-switch fetch
  useEffect(() => {
    fetchOrders(loadedPages)
  }, [fetchOrders, loadedPages])

  // Visibility-aware polling. Always-on while tab is visible; the cost is
  // bounded because we only refetch the loaded pages (not the full history).
  useEffect(() => {
    if (!zoUserId || !propertyId) return

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        const { zoUserId: u, propertyId: p, loadedPages: lp } = ctxRef.current
        if (u && p) fetchOrders(lp)
      }, POLL_INTERVAL_MS)
    }
    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        const { zoUserId: u, propertyId: p, loadedPages: lp } = ctxRef.current
        if (u && p) fetchOrders(lp)
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [zoUserId, propertyId, fetchOrders])

  const loadMore = useCallback(() => {
    if (orders.length >= totalCount) return
    setLoadedPages((p) => p + 1)
  }, [orders.length, totalCount])

  const refetch = useCallback(() => fetchOrders(loadedPages), [fetchOrders, loadedPages])

  const appendLocalOrder = useCallback((order: CafeOrderWithItems) => {
    // Avoid duplicating if the next poll already grabbed it.
    setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]))
    setTotalCount((c) => c + 1)
  }, [])

  // Silence "TERMINAL_STATUSES is declared but not used" lint by reading it
  // from a function callers may eventually consume. Kept exported in spirit
  // for a future "active vs done" split if we want one.
  void TERMINAL_STATUSES

  return {
    orders,
    totalCount,
    isLoading,
    hasMore: orders.length < totalCount,
    loadMore,
    refetch,
    appendLocalOrder,
  }
}
