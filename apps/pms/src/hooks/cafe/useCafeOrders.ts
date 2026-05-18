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

      // Single joined query — previously this hook did N+1 (one query per
      // order for items + one for the table). PostgREST embedding pulls
      // everything in one round-trip via FK relationships on order_id and
      // table_id.
      let query = supabase
        .from('cafe_orders')
        .select(
          '*, order_items:cafe_order_items(*), table:cafe_tables(*)',
          { count: 'exact' },
        )
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (kitchenStatus) {
        query = query.eq('kitchen_status', kitchenStatus as KitchenStatus)
      }

      const { data: orderData, error: orderError, count } = await query

      if (orderError) throw orderError

      setOrders((orderData || []) as CafeOrderWithItems[])
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
