import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../configs/supabase'
import { getNextStatus } from '../../lib/cafe/kitchen-status'
import { deductInventoryForOrder } from '../../lib/cafe/inventory-deduct'
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
        .order('created_at', { ascending: true })

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
            // New order — fetch full data and add to state
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
              // Refetch updated order and merge
              const fullOrder = await fetchOrderWithItems(changed.id)
              if (fullOrder) {
                setOrders((prev) =>
                  prev.map((o) => (o.id === changed.id ? fullOrder : o))
                )
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
        const order = orders.find((o) => o.id === orderId)
        if (order?.property_id) {
          deductInventoryForOrder(orderId, order.property_id).catch((err) =>
            console.error('Inventory deduction failed:', err)
          )
        }
      }
    },
    []
  )

  const cancelOrder = useCallback(async (orderId: string) => {
    const { error } = await supabase
      .from('cafe_orders')
      .update({ kitchen_status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      console.error('cancelOrder error:', error)
      return
    }

    // Remove from active board immediately
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }, [])

  return { orders, isLoading, advanceStatus, cancelOrder }
}
