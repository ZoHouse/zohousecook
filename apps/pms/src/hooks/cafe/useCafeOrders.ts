import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { CafeOrderWithItems, KitchenStatus } from '../../types/cafe'

interface UseCafeOrdersParams {
  propertyId: string | null
  kitchenStatus?: string | null
  page: number
  pageSize: number
}

interface UseCafeOrdersResult {
  orders: CafeOrderWithItems[]
  totalCount: number
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useCafeOrders({
  propertyId,
  kitchenStatus,
  page,
  pageSize,
}: UseCafeOrdersParams): UseCafeOrdersResult {
  const [orders, setOrders] = useState<CafeOrderWithItems[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!propertyId) {
      setOrders([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('cafe_orders')
        .select('*', { count: 'exact' })
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (kitchenStatus) {
        query = query.eq('kitchen_status', kitchenStatus as KitchenStatus)
      }

      const { data: orderData, error: orderError, count } = await query

      if (orderError) throw orderError

      const baseOrders = orderData || []

      // Fetch order items for all orders in parallel
      const ordersWithItems: CafeOrderWithItems[] = await Promise.all(
        baseOrders.map(async (order) => {
          const [itemsResult, tableResult] = await Promise.all([
            supabase
              .from('cafe_order_items')
              .select('*')
              .eq('order_id', order.id),
            order.table_id
              ? supabase
                  .from('cafe_tables')
                  .select('*')
                  .eq('id', order.table_id)
                  .single()
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
      setTotalCount(count ?? 0)
    } catch (err) {
      console.error('useCafeOrders error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId, kitchenStatus, page, pageSize])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, totalCount, isLoading, refetch: fetchOrders }
}
