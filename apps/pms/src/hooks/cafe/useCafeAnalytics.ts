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
      .select('id, subtotal, tax_amount, total, food_credit_applied_paise, kitchen_status')
      .eq('property_id', propertyId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (!orders || orders.length === 0) {
      setAnalytics({
        total_orders: 0,
        total_revenue: 0,
        food_credits_used: 0,
        avg_order_value: 0,
        active_orders: 0,
        popular_items: [],
      })
      setIsLoading(false)
      return
    }

    const activeStatuses = ['new', 'accepted', 'preparing', 'ready']

    // Cancelled orders never reached the kitchen — exclude from all revenue
    // and credit aggregates. They're still counted in total_orders though.
    const nonCancelled = orders.filter(o => o.kitchen_status !== 'cancelled')

    // Revenue = actual cash paid (cafe_orders.total is already post-food-credit).
    const totalRevenue = nonCancelled.reduce((sum, o) => sum + (o.total || 0), 0)

    // Food credits used = food value absorbed by $food credits across all
    // non-cancelled orders today. Lets ops see "how much food went out the
    // door without cash" alongside revenue.
    const foodCreditsUsed = nonCancelled.reduce(
      (sum, o) => sum + (o.food_credit_applied_paise || 0),
      0
    )

    // Avg order value should be over orders that actually paid CASH (total > 0).
    // Otherwise credit-only orders drag the average down and the number is
    // meaningless — a real example: 14 orders, 2 paid ₹44.10 cash, rest used
    // credits. Old math: ₹88.20 / 14 = ₹6.30 (wrong). New math: ₹88.20 / 2
    // = ₹44.10 (matches the actual cash orders).
    const cashOrders = nonCancelled.filter(o => (o.total || 0) > 0)
    const avgOrderValue = cashOrders.length > 0
      ? Math.round(totalRevenue / cashOrders.length)
      : 0

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
      food_credits_used: foodCreditsUsed,
      avg_order_value: avgOrderValue,
      active_orders: activeOrders,
      popular_items: popularItems,
    })
    setIsLoading(false)
  }, [propertyId])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  return { analytics, isLoading, refetch: fetchAnalytics }
}
