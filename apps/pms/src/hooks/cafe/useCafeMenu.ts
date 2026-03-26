import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { MenuCategory, MenuItem } from '../../types/cafe'

interface UseCafeMenuParams {
  categoryId?: string | null
  propertyId?: string | null
}

interface UseCafeMenuResult {
  categories: MenuCategory[]
  items: MenuItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createCategory: (name: string) => Promise<void>
  toggleCategory: (id: string, isActive: boolean) => Promise<void>
  createItem: (data: Record<string, unknown>) => Promise<string | null>
  updateItem: (id: string, data: Record<string, unknown>) => Promise<void>
  toggleAvailability: (id: string, isAvailable: boolean) => Promise<void>
}

export function useCafeMenu({ categoryId, propertyId }: UseCafeMenuParams = {}): UseCafeMenuResult {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch categories — filter by property if provided
      let catQuery = supabase
        .from('cafe_menu_categories')
        .select('*')
        .order('sort_order')

      if (propertyId) {
        catQuery = catQuery.eq('property_id', propertyId)
      }

      const catResult = await catQuery
      if (catResult.error) throw catResult.error
      setCategories(catResult.data || [])

      // If filtering by category
      let targetCatIds: string[] | null = null
      if (categoryId) {
        targetCatIds = [categoryId]
      }

      let itemQuery = supabase
        .from('cafe_menu_items')
        .select('*')
        .order('sort_order')

      // Filter by property — critical for is_available to show correct state
      if (propertyId) {
        itemQuery = itemQuery.eq('property_id', propertyId)
      }

      if (targetCatIds) {
        itemQuery = itemQuery.in('category_id', targetCatIds)
      }

      const itemResult = await itemQuery
      if (itemResult.error) throw itemResult.error

      // Deduplicate items by name (same item exists under both BLR + WTF categories)
      const seenItemNames = new Set<string>()
      const uniqueItems = (itemResult.data || []).filter((item) => {
        const lower = item.name.toLowerCase()
        if (seenItemNames.has(lower)) return false
        seenItemNames.add(lower)
        return true
      })
      setItems(uniqueItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [categoryId, propertyId])

  useEffect(() => { fetchData() }, [fetchData])

  const createCategory = useCallback(async (name: string) => {
    // Standardised menu: create category for all Zo House properties
    const { data: properties } = await supabase
      .from('cafe_properties')
      .select('id')
    if (!properties?.length) throw new Error('No properties found')
    const rows = properties.map((p) => ({ property_id: p.id, name, is_active: true, sort_order: 0 }))
    const { error } = await supabase
      .from('cafe_menu_categories')
      .insert(rows)
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

  const createItem = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
    // Standardised menu: create item for all properties under matching category names
    const categoryId = data.category_id as string
    if (!categoryId) throw new Error('category_id is required')

    // Find the category name, then find matching categories across all properties
    const { data: sourceCat } = await supabase
      .from('cafe_menu_categories')
      .select('name')
      .eq('id', categoryId)
      .single()
    if (!sourceCat) throw new Error('Category not found')

    const { data: matchingCats } = await supabase
      .from('cafe_menu_categories')
      .select('id, property_id')
      .eq('name', sourceCat.name)
    if (!matchingCats?.length) throw new Error('No matching categories')

    const rows = matchingCats.map((cat) => ({
      ...data,
      category_id: cat.id,
      property_id: cat.property_id,
      sort_order: 0,
    }))
    const { data: created, error } = await supabase
      .from('cafe_menu_items')
      .insert(rows)
      .select('id')
    if (error) throw error
    await fetchData()
    // Return the first created item's ID (for recipe saving)
    return created?.[0]?.id ?? null
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
