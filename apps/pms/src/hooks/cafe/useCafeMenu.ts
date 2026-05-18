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
  deleteCategory: (id: string) => Promise<void>
  createItem: (data: Record<string, unknown>) => Promise<string | null>
  updateItem: (id: string, data: Record<string, unknown>) => Promise<void>
  toggleAvailability: (id: string, isAvailable: boolean) => Promise<void>
  deleteItem: (id: string) => Promise<void>
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

      const allCats = (catResult.data || []) as MenuCategory[]

      // Dedupe categories by name (standardised menu spans BLR + WTF).
      // Remember canonical id per name so we can remap items to it.
      const canonicalIdByName = new Map<string, string>()
      const uniqueCats: MenuCategory[] = []
      for (const cat of allCats) {
        const key = cat.name.toLowerCase()
        if (canonicalIdByName.has(key)) continue
        canonicalIdByName.set(key, cat.id)
        uniqueCats.push(cat)
      }
      setCategories(uniqueCats)

      // Map every (possibly duplicate) category id → its name, for item remap below.
      const nameByCatId = new Map<string, string>()
      for (const cat of allCats) nameByCatId.set(cat.id, cat.name.toLowerCase())

      // Filtering by a (canonical) category id → expand to all per-property siblings sharing that name.
      let targetCatIds: string[] | null = null
      if (categoryId) {
        const targetName = nameByCatId.get(categoryId)
        targetCatIds = targetName
          ? allCats.filter((c) => c.name.toLowerCase() === targetName).map((c) => c.id)
          : [categoryId]
      }

      let itemQuery = supabase
        .from('cafe_menu_items')
        .select('*')
        .order('is_available', { ascending: false })
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

      // Dedupe items by name, then remap category_id to the canonical category
      // so getItemCount(cat.id) in the page still finds them after category dedup.
      const seenItemNames = new Set<string>()
      const uniqueItems = (itemResult.data || [])
        .filter((item) => {
          const lower = item.name.toLowerCase()
          if (seenItemNames.has(lower)) return false
          seenItemNames.add(lower)
          return true
        })
        .map((item) => {
          const catName = nameByCatId.get(item.category_id)
          const canonicalId = catName ? canonicalIdByName.get(catName) : undefined
          return canonicalId && canonicalId !== item.category_id
            ? { ...item, category_id: canonicalId }
            : item
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
    // Standardised menu: toggle every per-property row that shares this category's name.
    const { data: src } = await supabase
      .from('cafe_menu_categories')
      .select('name')
      .eq('id', id)
      .single()
    if (!src) throw new Error('Category not found')
    const { error } = await supabase
      .from('cafe_menu_categories')
      .update({ is_active: isActive })
      .eq('name', src.name)
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
    // Standardised menu: update every per-property row that shares this item's name.
    // Strip identity/property fields so we don't clobber cross-property scoping.
    const { data: src } = await supabase
      .from('cafe_menu_items')
      .select('name')
      .eq('id', id)
      .single()
    if (!src) throw new Error('Item not found')
    const { id: _omitId, property_id: _omitProp, category_id: _omitCat, ...safe } = data as Record<string, unknown>
    const { error } = await supabase
      .from('cafe_menu_items')
      .update(safe)
      .eq('name', src.name)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const deleteItem = useCallback(async (id: string) => {
    // Standardised menu: delete every per-property row that shares this item's name.
    // Note: cafe_order_items stores name/price on the row, so order history is preserved.
    const { data: src } = await supabase
      .from('cafe_menu_items')
      .select('name')
      .eq('id', id)
      .single()
    if (!src) throw new Error('Item not found')
    const { error } = await supabase
      .from('cafe_menu_items')
      .delete()
      .eq('name', src.name)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const deleteCategory = useCallback(async (id: string) => {
    // Standardised menu: delete every per-property row sharing this category's name,
    // plus all items under any of those category rows.
    const { data: src } = await supabase
      .from('cafe_menu_categories')
      .select('name')
      .eq('id', id)
      .single()
    if (!src) throw new Error('Category not found')
    const { data: matchingCats } = await supabase
      .from('cafe_menu_categories')
      .select('id')
      .eq('name', src.name)
    const catIds = (matchingCats || []).map((c) => c.id)
    if (catIds.length) {
      const { error: itemErr } = await supabase
        .from('cafe_menu_items')
        .delete()
        .in('category_id', catIds)
      if (itemErr) throw itemErr
    }
    const { error } = await supabase
      .from('cafe_menu_categories')
      .delete()
      .eq('name', src.name)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    // Standardised menu: availability toggle propagates to every property's copy.
    const { data: src } = await supabase
      .from('cafe_menu_items')
      .select('name')
      .eq('id', id)
      .single()
    if (!src) throw new Error('Item not found')
    const { error } = await supabase
      .from('cafe_menu_items')
      .update({ is_available: isAvailable })
      .eq('name', src.name)
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
    deleteCategory,
    createItem,
    updateItem,
    toggleAvailability,
    deleteItem,
  }
}
