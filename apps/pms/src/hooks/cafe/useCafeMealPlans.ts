import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../../configs/supabase'
import type { MealPlan, MealPlanWithItems, MealType } from '../../types/cafe'

interface UseMealPlansParams {
  from: string
  to: string
}

interface UseMealPlansResult {
  plans: MealPlanWithItems[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createPlan: (date: string, mealType: MealType, servingStart: string, servingEnd: string, notes?: string) => Promise<MealPlan | null>
  updatePlan: (id: string, updates: { serving_start?: string; serving_end?: string; notes?: string; image_url?: string }) => Promise<void>
  addItem: (planId: string, menuItemId: string) => Promise<void>
  removeItem: (planId: string, itemId: string) => Promise<void>
  copyPlans: (sourceFrom: string, sourceTo: string, targetFrom: string) => Promise<{ created: number; skipped: number } | null>
}

export function useCafeMealPlans({ from, to }: UseMealPlansParams): UseMealPlansResult {
  const [plans, setPlans] = useState<MealPlanWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialLoadDone = useRef(false)

  const fetchData = useCallback(async () => {
    if (!from || !to) return
    if (!initialLoadDone.current) setIsLoading(true)
    setError(null)

    try {
      const { data: plansData, error: plansErr } = await supabase
        .from('cafe_meal_plans')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date')
        .order('meal_type')

      if (plansErr) throw plansErr

      if (!plansData || plansData.length === 0) {
        setPlans([])
        initialLoadDone.current = true
        return
      }

      // Fetch items for all plans in one query, joined with menu items
      const planIds = plansData.map((p) => p.id)
      const { data: itemsData, error: itemsErr } = await supabase
        .from('cafe_meal_plan_items')
        .select('*, menu_item:cafe_menu_items(*)')
        .in('meal_plan_id', planIds)
        .order('sort_order')

      if (itemsErr) throw itemsErr

      // Merge items into plans
      const plansWithItems: MealPlanWithItems[] = plansData.map((plan) => ({
        ...plan,
        items: (itemsData || []).filter((item) => item.meal_plan_id === plan.id),
      }))

      setPlans(plansWithItems)
      initialLoadDone.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [from, to])

  const silentRefetch = useCallback(async () => {
    if (!from || !to) return
    try {
      const { data: plansData } = await supabase
        .from('cafe_meal_plans')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date')
        .order('meal_type')

      if (!plansData) return

      const planIds = plansData.map((p) => p.id)
      const { data: itemsData } = await supabase
        .from('cafe_meal_plan_items')
        .select('*, menu_item:cafe_menu_items(*)')
        .in('meal_plan_id', planIds.length > 0 ? planIds : ['no-match'])
        .order('sort_order')

      const plansWithItems: MealPlanWithItems[] = plansData.map((plan) => ({
        ...plan,
        items: (itemsData || []).filter((item) => item.meal_plan_id === plan.id),
      }))

      setPlans(plansWithItems)
    } catch {
      // Silent — data will be stale but that's acceptable
    }
  }, [from, to])

  // Reset on week change
  useEffect(() => {
    initialLoadDone.current = false
    fetchData()
  }, [fetchData])

  const createPlan = useCallback(async (
    date: string,
    mealType: MealType,
    servingStart: string,
    servingEnd: string,
    notes?: string,
  ) => {
    const { data, error: err } = await supabase
      .from('cafe_meal_plans')
      .insert({
        date,
        meal_type: mealType,
        serving_start: servingStart,
        serving_end: servingEnd,
        notes: notes || null,
      })
      .select()
      .single()

    if (err) throw err
    await silentRefetch()
    return data as MealPlan
  }, [silentRefetch])

  const updatePlan = useCallback(async (
    id: string,
    updates: { serving_start?: string; serving_end?: string; notes?: string; image_url?: string },
  ) => {
    const { error: err } = await supabase
      .from('cafe_meal_plans')
      .update(updates)
      .eq('id', id)
    if (err) throw err
    await silentRefetch()
  }, [silentRefetch])

  const addItem = useCallback(async (planId: string, menuItemId: string) => {
    // Get current max sort_order for this plan
    const { data: existing } = await supabase
      .from('cafe_meal_plan_items')
      .select('sort_order')
      .eq('meal_plan_id', planId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSort = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0

    const { error: err } = await supabase
      .from('cafe_meal_plan_items')
      .insert({ meal_plan_id: planId, menu_item_id: menuItemId, sort_order: nextSort })

    if (err) throw err
    await silentRefetch()
  }, [silentRefetch])

  const removeItem = useCallback(async (planId: string, itemId: string) => {
    const { error: err } = await supabase
      .from('cafe_meal_plan_items')
      .delete()
      .eq('id', itemId)
      .eq('meal_plan_id', planId)
    if (err) throw err
    await silentRefetch()
  }, [silentRefetch])

  const copyPlans = useCallback(async (
    sourceFrom: string,
    sourceTo: string,
    targetFrom: string,
  ) => {
    try {
      // Fetch source week plans with items
      const { data: sourcePlans, error: sourceErr } = await supabase
        .from('cafe_meal_plans')
        .select('*')
        .gte('date', sourceFrom)
        .lte('date', sourceTo)

      if (sourceErr) throw sourceErr
      if (!sourcePlans || sourcePlans.length === 0) return { created: 0, skipped: 0 }

      const sourcePlanIds = sourcePlans.map((p) => p.id)
      const { data: sourceItems } = await supabase
        .from('cafe_meal_plan_items')
        .select('*')
        .in('meal_plan_id', sourcePlanIds)
        .order('sort_order')

      // Compute offset in days between source start and target start
      const sourceDate = new Date(sourceFrom)
      const targetDate = new Date(targetFrom)
      const dayOffsetMs = targetDate.getTime() - sourceDate.getTime()
      const dayOffset = Math.round(dayOffsetMs / (1000 * 60 * 60 * 24))

      let created = 0
      let skipped = 0

      for (const plan of sourcePlans) {
        const planDate = new Date(plan.date)
        planDate.setDate(planDate.getDate() + dayOffset)
        const newDateStr = planDate.toISOString().split('T')[0]

        // Check if a plan already exists for this date+meal_type
        const { data: existing } = await supabase
          .from('cafe_meal_plans')
          .select('id')
          .eq('date', newDateStr)
          .eq('meal_type', plan.meal_type)
          .maybeSingle()

        if (existing) {
          skipped++
          continue
        }

        // Create the new plan
        const { data: newPlan, error: createErr } = await supabase
          .from('cafe_meal_plans')
          .insert({
            date: newDateStr,
            meal_type: plan.meal_type,
            serving_start: plan.serving_start,
            serving_end: plan.serving_end,
            notes: plan.notes,
          })
          .select()
          .single()

        if (createErr) throw createErr

        // Copy items
        const planItems = (sourceItems || []).filter((i) => i.meal_plan_id === plan.id)
        if (planItems.length > 0) {
          await supabase
            .from('cafe_meal_plan_items')
            .insert(planItems.map((item) => ({
              meal_plan_id: newPlan.id,
              menu_item_id: item.menu_item_id,
              sort_order: item.sort_order,
            })))
        }

        created++
      }

      await silentRefetch()
      return { created, skipped }
    } catch (err) {
      console.error('copyPlans error:', err)
      return null
    }
  }, [silentRefetch])

  return {
    plans, isLoading, error, refetch: fetchData,
    createPlan, updatePlan,
    addItem, removeItem, copyPlans,
  }
}
