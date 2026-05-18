import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { MenuCategory, MenuItem } from '../../types/cafe'

// Find every same-named sibling row for a menu item across properties.
// Returns [] when the source item or its category can't be resolved so
// callers can choose a fallback. The logic mirrors deleteItem's: walk
// item → its category name → all same-named categories → all items with
// that name in those categories.
async function findSiblingMenuItemIds(itemId: string): Promise<string[]> {
  const { data: sourceItem } = await supabase
    .from('cafe_menu_items')
    .select('name, category_id')
    .eq('id', itemId)
    .maybeSingle()
  if (!sourceItem) return []

  const { data: sourceCat } = await supabase
    .from('cafe_menu_categories')
    .select('name')
    .eq('id', sourceItem.category_id)
    .maybeSingle()
  if (!sourceCat) return []

  const { data: matchingCats } = await supabase
    .from('cafe_menu_categories')
    .select('id')
    .eq('name', sourceCat.name)
  const matchingCatIds = (matchingCats || []).map((c) => c.id)
  if (matchingCatIds.length === 0) return []

  const { data: siblings } = await supabase
    .from('cafe_menu_items')
    .select('id')
    .eq('name', sourceItem.name)
    .in('category_id', matchingCatIds)
  return (siblings || []).map((s) => s.id)
}

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
  deleteItem: (id: string) => Promise<number>
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

      // Standardised menu: a category like "Mains" exists once per property,
      // so without dedup the chip row shows duplicates. When propertyId is
      // set we already only see that property's rows, so dedup is a no-op
      // there. Otherwise collapse by lowercase name.
      const allCats = (catResult.data as MenuCategory[]) || []
      const seenCatNames = new Set<string>()
      const uniqueCats = propertyId
        ? allCats
        : allCats.filter((c) => {
            const k = c.name.toLowerCase()
            if (seenCatNames.has(k)) return false
            seenCatNames.add(k)
            return true
          })
      setCategories(uniqueCats)

      // When filtering by category, expand the selected category id to all
      // its same-named siblings across properties so the item list includes
      // every property's rows for that category (then we dedup by item name).
      let targetCatIds: string[] | null = null
      if (categoryId) {
        const selected = allCats.find((c) => c.id === categoryId)
        if (selected) {
          targetCatIds = allCats
            .filter((c) => c.name.toLowerCase() === selected.name.toLowerCase())
            .map((c) => c.id)
        } else {
          targetCatIds = [categoryId]
        }
      }

      let itemQuery = supabase
        .from('cafe_menu_items')
        .select('*')
        .order('is_available', { ascending: false })
        .order('sort_order')

      if (propertyId) {
        itemQuery = itemQuery.eq('property_id', propertyId)
      }

      if (targetCatIds) {
        itemQuery = itemQuery.in('category_id', targetCatIds)
      }

      const itemResult = await itemQuery
      if (itemResult.error) throw itemResult.error

      // Items are physically duplicated per property as part of the
      // standardised-menu design. Cascade in createItem/updateItem/
      // toggleAvailability/deleteItem keeps siblings in sync; this dedup is
      // just a presentation collapse. When propertyId is set we keep all
      // rows (per-property view).
      const allItems = (itemResult.data as MenuItem[]) || []
      const seenItemNames = new Set<string>()
      const uniqueItems = propertyId
        ? allItems
        : allItems.filter((item) => {
            const k = item.name.toLowerCase()
            if (seenItemNames.has(k)) return false
            seenItemNames.add(k)
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

  // Cascade across same-named category rows across properties so admins
  // can't accidentally hide "Mains" on BLR but leave it visible on WTF.
  const toggleCategory = useCallback(async (id: string, isActive: boolean) => {
    const { data: source } = await supabase
      .from('cafe_menu_categories')
      .select('name')
      .eq('id', id)
      .maybeSingle()
    let targetIds: string[] = [id]
    if (source?.name) {
      const { data: matching } = await supabase
        .from('cafe_menu_categories')
        .select('id')
        .eq('name', source.name)
      if (matching && matching.length > 0) {
        targetIds = matching.map((c) => c.id)
      }
    }
    const { error } = await supabase
      .from('cafe_menu_categories')
      .update({ is_active: isActive })
      .in('id', targetIds)
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

  // Standardised menu: cascade edits to every same-named sibling across
  // properties. Without this, editing "Masala Dosa" on the admin only
  // touches one property's row — the other property's customer page
  // silently drifts (old price/description). Mirrors deleteItem's lookup.
  // Fields that are inherently property-scoped (property_id, category_id,
  // sort_order, image_url) are stripped from the update payload so each
  // sibling keeps its own scoping but gets the same content updates.
  const updateItem = useCallback(async (id: string, data: Record<string, unknown>) => {
    const siblingIds = await findSiblingMenuItemIds(id)
    if (siblingIds.length === 0) {
      // Fall back to single-row update if we can't resolve siblings (item
      // deleted between fetches, etc.) so the user's edit still applies
      // somewhere instead of silently no-op'ing.
      const { error } = await supabase.from('cafe_menu_items').update(data).eq('id', id)
      if (error) throw error
      await fetchData()
      return
    }

    // Strip per-property fields from the payload before cascading.
    const cascadeData: Record<string, unknown> = { ...data }
    delete cascadeData.property_id
    delete cascadeData.category_id
    delete cascadeData.id

    const { error } = await supabase
      .from('cafe_menu_items')
      .update(cascadeData)
      .in('id', siblingIds)
    if (error) throw error
    await fetchData()
  }, [fetchData])

  const deleteItem = useCallback(async (id: string): Promise<number> => {
    // Standardised menu: delete the item across all properties under matching category names.
    // Mirrors createItem's cross-property cascade.
    const { data: sourceItem, error: sourceErr } = await supabase
      .from('cafe_menu_items')
      .select('name, category_id')
      .eq('id', id)
      .single()
    if (sourceErr || !sourceItem) throw sourceErr || new Error('Item not found')

    const { data: sourceCat } = await supabase
      .from('cafe_menu_categories')
      .select('name')
      .eq('id', sourceItem.category_id)
      .single()
    if (!sourceCat) throw new Error('Category not found')

    const { data: matchingCats } = await supabase
      .from('cafe_menu_categories')
      .select('id')
      .eq('name', sourceCat.name)
    const matchingCatIds = (matchingCats || []).map((c) => c.id)
    if (!matchingCatIds.length) throw new Error('No matching categories')

    // Find all sibling rows (same name + same-named category across properties)
    const { data: siblings, error: siblingErr } = await supabase
      .from('cafe_menu_items')
      .select('id')
      .eq('name', sourceItem.name)
      .in('category_id', matchingCatIds)
    if (siblingErr) throw siblingErr
    const siblingIds = (siblings || []).map((s) => s.id)
    if (!siblingIds.length) return 0

    // Remove dependent recipe rows first (menu_item is the owner)
    const { error: recipeErr } = await supabase
      .from('cafe_recipe_items')
      .delete()
      .in('menu_item_id', siblingIds)
    if (recipeErr) throw recipeErr

    const { error: delErr } = await supabase
      .from('cafe_menu_items')
      .delete()
      .in('id', siblingIds)
    if (delErr) throw delErr

    await fetchData()
    return siblingIds.length
  }, [fetchData])

  // Cascade availability across all property siblings — toggling
  // "unavailable" in admin must hide the item from BOTH properties'
  // customer pages, not just one.
  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    const siblingIds = await findSiblingMenuItemIds(id)
    const targetIds = siblingIds.length > 0 ? siblingIds : [id]
    const { error } = await supabase
      .from('cafe_menu_items')
      .update({ is_available: isAvailable })
      .in('id', targetIds)
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
    deleteItem,
    toggleAvailability,
  }
}
