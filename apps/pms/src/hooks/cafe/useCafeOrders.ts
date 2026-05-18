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

      // Single round-trip via PostgREST embedded selects — previous version
      // made 1 base query + 2N queries per page (50+ requests for 25 orders,
      // Sai's B7). PostgREST resolves cafe_order_items and cafe_tables in
      // the same response.
      let query = supabase
        .from('cafe_orders')
        .select(
          '*, order_items:cafe_order_items(*), table:cafe_tables(*)',
          { count: 'exact' }
        )
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (kitchenStatus) {
        query = query.eq('kitchen_status', kitchenStatus as KitchenStatus)
      }

      const { data: orderData, error: orderError, count } = await query

      if (orderError) throw orderError

      const ordersWithItems: CafeOrderWithItems[] = (orderData || []).map(
        (o) => ({
          ...o,
          order_items: o.order_items || [],
          table: o.table || null,
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
