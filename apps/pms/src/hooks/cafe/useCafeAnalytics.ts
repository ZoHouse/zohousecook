import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryApi } from '@zo/auth'
import { GeneralObject } from '@zo/definitions/general'
import { supabase } from '../../configs/supabase'
import { normalizePhone } from '../../lib/cafe/phone-normalize'
import useAssociation from '../useAssociation'
import type { DailyAnalytics } from '../../types/cafe'

export function useCafeAnalytics(propertyId: string | null) {
  const { selectedOperator } = useAssociation()
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Staff list for the current property — same ADMIN_ASSOCIATION query the
  // /staff page uses. Used to tag a food-credit spend as staff (team meal
  // perk — not revenue) vs customer (real revenue).
  const { data: staffData } = useQueryApi<{ data: { results: GeneralObject[] } }>(
    'ADMIN_ASSOCIATION',
    {
      enabled: !!selectedOperator?.id,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    '',
    `limit=1000&model=Operator&value=${selectedOperator?.id}`,
  )

  // Normalised (last-10-digit) set of staff phone numbers. If the staff list
  // hasn't loaded yet this is empty — all credits then fall into the customer
  // bucket and recompute once it resolves; the total is never wrong.
  const staffPhones = useMemo(() => {
    const set = new Set<string>()
    const results = staffData?.data?.results || []
    for (const a of results) {
      const mobile = (a as GeneralObject)?.user?.mobile
      if (mobile) {
        const n = normalizePhone(String(mobile))
        if (n.length === 10) set.add(n)
      }
    }
    return set
  }, [staffData])

  const fetchAnalytics = useCallback(async () => {
    if (!propertyId) { setAnalytics(null); setIsLoading(false); return }
    setIsLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { data: orders } = await supabase
      .from('cafe_orders')
      .select(
        'id, customer_phone, subtotal, tax_amount, total, food_credit_applied_paise, kitchen_status',
      )
      .eq('property_id', propertyId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (!orders || orders.length === 0) {
      setAnalytics({
        total_orders: 0,
        total_revenue: 0,
        food_credits_used: 0,
        staff_food_credits: 0,
        customer_food_credits: 0,
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

    // Split $food credit spend into staff vs customer. An order counts as
    // "staff" when its phone number matches a staff member; staff meals are a
    // team perk, not revenue. Orders with no phone can't be matched and fall
    // into the customer bucket.
    let staffFoodCredits = 0
    let customerFoodCredits = 0
    for (const o of nonCancelled) {
      const credit = o.food_credit_applied_paise || 0
      if (credit === 0) continue
      const phone = o.customer_phone ? normalizePhone(String(o.customer_phone)) : ''
      if (phone && staffPhones.has(phone)) {
        staffFoodCredits += credit
      } else {
        customerFoodCredits += credit
      }
    }
    const foodCreditsUsed = staffFoodCredits + customerFoodCredits

    // Avg order value should be over orders that actually paid CASH (total > 0).
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
      staff_food_credits: staffFoodCredits,
      customer_food_credits: customerFoodCredits,
      avg_order_value: avgOrderValue,
      active_orders: activeOrders,
      popular_items: popularItems,
    })
    setIsLoading(false)
  }, [propertyId, staffPhones])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  return { analytics, isLoading, refetch: fetchAnalytics }
}
