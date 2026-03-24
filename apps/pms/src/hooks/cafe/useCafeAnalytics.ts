import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { DailyAnalytics } from '../../types/cafe'

export function useCafeAnalytics(propertyId: string | null) {
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    if (!propertyId) { setAnalytics(null); setIsLoading(false); return }
    setIsLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { data: orders } = await supabase
      .from('cafe_orders')
      .select('id, total, kitchen_status')
      .eq('property_id', propertyId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (!orders || orders.length === 0) {
      setAnalytics({ total_orders: 0, total_revenue: 0, avg_order_value: 0, active_orders: 0, popular_items: [] })
      setIsLoading(false)
      return
    }

    const activeStatuses = ['new', 'accepted', 'preparing', 'ready']
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
    const activeOrders = orders.filter(o => activeStatuses.includes(o.kitchen_status || '')).length

    const { data: orderItems } = await supabase
      .from('cafe_order_items')
      .select('name, quantity, order_id')
      .in('order_id', orders.map(o => o.id))
      .eq('item_status', 'active')

    const itemCounts: Record<string, number> = {}
    orderItems?.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
    })
    const popularItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    setAnalytics({
      total_orders: orders.length,
      total_revenue: totalRevenue,
      avg_order_value: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      active_orders: activeOrders,
      popular_items: popularItems,
    })
    setIsLoading(false)
  }, [propertyId])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  return { analytics, isLoading, refetch: fetchAnalytics }
}
