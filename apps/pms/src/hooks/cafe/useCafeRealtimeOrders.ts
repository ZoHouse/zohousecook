import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../configs/supabase'
import { getNextStatus } from '../../lib/cafe/kitchen-status'
import { deductInventoryForOrder, restoreInventoryForOrder } from '../../lib/cafe/inventory-deduct'
import { restoreFoodCredits } from '../../lib/cafe/food-credit-debit'
import { startKitchenAlertLoop, stopKitchenAlertLoop } from '../../lib/cafe/kitchen-alert'
import type { CafeOrder, CafeOrderWithItems, KitchenStatus } from '../../types/cafe'

const ACTIVE_STATUSES: KitchenStatus[] = ['new', 'accepted', 'preparing', 'ready']

interface UseCafeRealtimeOrdersResult {
  orders: CafeOrderWithItems[]
  isLoading: boolean
  advanceStatus: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
}

async function fetchOrderWithItems(orderId: string): Promise<CafeOrderWithItems | null> {
  const { data: order, error } = await supabase
    .from('cafe_orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) return null

  const [itemsResult, tableResult] = await Promise.all([
    supabase.from('cafe_order_items').select('*').eq('order_id', orderId),
    order.table_id
      ? supabase.from('cafe_tables').select('*').eq('id', order.table_id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  return {
    ...order,
    order_items: itemsResult.data || [],
    table: tableResult.data || null,
  }
}

export function useCafeRealtimeOrders(propertyId: string | null): UseCafeRealtimeOrdersResult {
  const [orders, setOrders] = useState<CafeOrderWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchAllOrders = useCallback(async () => {
    if (!propertyId) {
      setOrders([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const { data: orderData, error } = await supabase
        .from('cafe_orders')
        .select('*')
        .eq('property_id', propertyId)
        .in('kitchen_status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })

      if (error) throw error

      const ordersWithItems: CafeOrderWithItems[] = await Promise.all(
        (orderData || []).map(async (order) => {
          const [itemsResult, tableResult] = await Promise.all([
            supabase.from('cafe_order_items').select('*').eq('order_id', order.id),
            order.table_id
              ? supabase.from('cafe_tables').select('*').eq('id', order.table_id).single()
              : Promise.resolve({ data: null, error: null }),
          ])
          return {
            ...order,
            order_items: itemsResult.data || [],
            table: tableResult.data || null,
          }
        })
      )

      setOrders(ordersWithItems)
    } catch (err) {
      console.error('useCafeRealtimeOrders fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  // Initial fetch
  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  // Realtime subscription
  useEffect(() => {
    if (!propertyId) return

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`kitchen-orders-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafe_orders',
          filter: `property_id=eq.${propertyId}`,
        },
        async (payload) => {
          const changed = payload.new as CafeOrder

          if (payload.eventType === 'INSERT') {
            // New order — fetch full data and add to state. The [orders]
            // effect below will spin up the alert loop once a 'new' order
            // lands; drafts are suppressed so chefs aren't woken up by
            // unpaid carts.
            const fullOrder = await fetchOrderWithItems(changed.id)
            if (fullOrder && ACTIVE_STATUSES.includes(fullOrder.kitchen_status as KitchenStatus)) {
              setOrders((prev) => [fullOrder, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const status = changed.kitchen_status as KitchenStatus
            if (status === 'served' || status === 'cancelled') {
              // Remove from board
              setOrders((prev) => prev.filter((o) => o.id !== changed.id))
            } else {
              // Refetch updated order. If the order isn't on the board yet
              // (e.g. draft → new after Razorpay capture), add it and beep.
              // Otherwise just merge in the update.
              const fullOrder = await fetchOrderWithItems(changed.id)
              if (fullOrder) {
                setOrders((prev) => {
                  const idx = prev.findIndex((o) => o.id === changed.id)
                  if (!ACTIVE_STATUSES.includes(status)) {
                    return idx === -1 ? prev : prev.filter((o) => o.id !== changed.id)
                  }
                  if (idx === -1) {
                    // Fresh-to-board (draft just became visible). The
                    // [orders] effect below will start the alert loop when
                    // a 'new' order is present.
                    return [fullOrder, ...prev]
                  }
                  const next = prev.slice()
                  next[idx] = fullOrder
                  return next
                })
              }
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [propertyId])

  // Keep the alert ringing while any order is still in 'new' (i.e. unaccepted).
  // The moment all 'new' orders have been accepted (or removed), stop the loop.
  useEffect(() => {
    const hasUnaccepted = orders.some((o) => o.kitchen_status === 'new')
    if (hasUnaccepted) {
      startKitchenAlertLoop()
    } else {
      stopKitchenAlertLoop()
    }
  }, [orders])

  // Safety: stop the loop on unmount so a stale interval doesn't keep ringing
  // after the chef leaves the kitchen board.
  useEffect(() => {
    return () => { stopKitchenAlertLoop() }
  }, [])

  const advanceStatus = useCallback(
    async (orderId: string, currentStatus: KitchenStatus) => {
      const nextStatus = getNextStatus(currentStatus)
      if (!nextStatus) return

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, kitchen_status: nextStatus } : o
        )
      )

      const { error } = await supabase
        .from('cafe_orders')
        .update({ kitchen_status: nextStatus })
        .eq('id', orderId)

      if (error) {
        console.error('advanceStatus error:', error)
        // Revert optimistic update on failure
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, kitchen_status: currentStatus } : o
          )
        )
        return
      }

      // Deduct inventory when order is accepted (kitchen commits to making it)
      if (nextStatus === 'accepted') {
        // Fetch property_id directly to avoid stale closure over orders
        const { data: orderRow } = await supabase
          .from('cafe_orders')
          .select('property_id')
          .eq('id', orderId)
          .single()
        if (orderRow?.property_id) {
          deductInventoryForOrder(orderId, orderRow.property_id).catch((err) =>
            console.error('Inventory deduction failed:', err)
          )
        }

        // $food credits are debited at PLACE time inside place_cafe_order
        // (and at topup time inside update_cafe_order_food_credits). Do NOT
        // debit again on accept — the unique-spend index on (reference_id,
        // type='spend') protects against the simple place→accept replay but
        // NOT against place→topup→accept, which uses a different reference
        // id for the topup row and so silently double-debited every order
        // that flowed through "Complete Payment". Removed 2026-05-18.
      }
    },
    []
  )

  const cancelOrder = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    // Inventory deduction happens on kitchen ACCEPT (deductInventoryForOrder
    // fires at the new→accepted transition), so the inventory restore is
    // gated on having been accepted. Food credits and Razorpay payment are
    // both committed at PLACE time (place_cafe_order RPC debits credits;
    // create-razorpay-order + capture pulls cash) so they need refunding
    // regardless of whether the kitchen ever accepted.
    const wasAccepted = order?.kitchen_status && ['accepted', 'preparing', 'ready'].includes(order.kitchen_status)
    const wasPaidByRazorpay = order?.payment_mode === 'razorpay' && order?.payment_status === 'paid'

    // Mark cancelled. Also flip payment_status='refunded' on Razorpay-paid
    // orders so the FE/UI reflects that the money has to come back to the
    // customer. Note: this just updates our DB — the actual Razorpay refund
    // API call is TODO (see #refund-todo). Until that's wired up, staff must
    // manually refund via Razorpay Dashboard. The status='refunded' here
    // ensures we don't lose track of which payments owe the customer.
    const updates: Record<string, unknown> = { kitchen_status: 'cancelled' }
    if (wasPaidByRazorpay) updates.payment_status = 'refunded'

    const { error } = await supabase
      .from('cafe_orders')
      .update(updates)
      .eq('id', orderId)

    if (error) {
      console.error('cancelOrder error:', error)
      return
    }

    // Remove from active board immediately
    setOrders((prev) => prev.filter((o) => o.id !== orderId))

    // Restore inventory ONLY if it was deducted (i.e. order was accepted).
    if (wasAccepted && order?.property_id) {
      restoreInventoryForOrder(orderId, order.property_id).catch((err) =>
        console.error('Inventory restore failed:', err)
      )
    }

    // Restore $food credits ALWAYS — they were debited at place_cafe_order
    // time, before kitchen acceptance. restoreFoodCredits short-circuits
    // when food_credit_applied_paise is 0/null, so this is safe to call
    // unconditionally.
    restoreFoodCredits(orderId).catch((err) =>
      console.error('Food credit restore failed:', err)
    )

    if (wasPaidByRazorpay) {
      // #refund-todo: implement /pm/api/cafe/refund-razorpay endpoint that
      // calls POST /v1/payments/{payment_id}/refund and confirms before we
      // set payment_status='refunded'. For now we mark the row above so
      // staff sees "Refunded" and can reconcile manually via Dashboard.
      console.warn(
        'cancelOrder: Razorpay refund not auto-issued for paid order',
        orderId,
        '— flagged as refunded in DB; refund manually via Razorpay Dashboard.',
      )
    }
  }, [orders])

  return { orders, isLoading, advanceStatus, cancelOrder }
}
