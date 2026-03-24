import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { MenuCategory, MenuItem } from '../../types/cafe'

interface UseCafeMenuParams {
  categoryId?: string | null
}

interface UseCafeMenuResult {
  categories: MenuCategory[]
  items: MenuItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createCategory: (name: string) => Promise<void>
  toggleCategory: (id: string, isActive: boolean) => Promise<void>
  createItem: (data: Record<string, unknown>) => Promise<void>
  updateItem: (id: string, data: Record<string, unknown>) => Promise<void>
  toggleAvailability: (id: string, isAvailable: boolean) => Promise<void>
}

export function useCafeMenu({ categoryId }: UseCafeMenuParams = {}): UseCafeMenuResult {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Menu is standardised — don't filter categories by property_id
      const catQuery = supabase
        .from('cafe_menu_categories')
        .select('*')
        .order('sort_order')

      let itemQuery = supabase
        .from('cafe_menu_items')
        .select('*')
        .order('sort_order')

      if (categoryId) {
        itemQuery = itemQuery.eq('category_id', categoryId)
      }

      const [catResult, itemResult] = await Promise.all([catQuery, itemQuery])

      if (catResult.error) throw catResult.error
      if (itemResult.error) throw itemResult.error

      setCategories(catResult.data || [])
      setItems(itemResult.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [categoryId])

  useEffect(() => { fetchData() }, [fetchData])

  const createCategory = useCallback(async (name: string) => {
    const { error } = await supabase
      .from('cafe_menu_categories')
      .insert({ name, is_active: true, sort_order: 0 })
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const toggleCategory = useCallback(async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('cafe_menu_categories')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const createItem = useCallback(async (data: Record<string, unknown>) => {
    const { error } = await supabase
      .from('cafe_menu_items')
      .insert({ ...data, sort_order: 0 })
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const updateItem = useCallback(async (id: string, data: Record<string, unknown>) => {
    const { error } = await supabase
      .from('cafe_menu_items')
      .update(data)
      .eq('id', id)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    const { error } = await supabase
      .from('cafe_menu_items')
      .update({ is_available: isAvailable })
      .eq('id', id)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  return {
    categories,
    items,
    isLoading,
    error,
    refetch: fetchData,
    createCategory,
    toggleCategory,
    createItem,
    updateItem,
    toggleAvailability,
  }
}
