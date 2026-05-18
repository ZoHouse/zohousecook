import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import {
  buildCategoryIdByPropertyForName,
  findSiblingMenuItemIds,
} from '../../lib/cafe/menu-siblings'
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
    // Per-outlet: each outlet decides whether to show a category on its own
    // customer menu (kitchen capacity, staffing exigencies). Same logic as
    // toggleAvailability — DO NOT fan out across properties.
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
    // CafeZomad is one entity with one standardised menu. Standardised
    // fields — price, name, description, image, macros, recipe text,
    // ingredients text, diet, daily_limit, category move — must fan out to
    // every sibling row across outlets so BLR and WTF describe the same
    // dish. is_available is the exception: it stays per-outlet because
    // each kitchen runs its own inventory and can hide an item locally.
    //
    // Sibling = same item name (case-insensitive) AND same category name
    // (case-insensitive). Scoping by category-name prevents touching the
    // FUDR-imported legacy rows kept for order-history sanity that live in
    // archived categories. See lib/cafe/menu-siblings.ts.
    const sibIds = await findSiblingMenuItemIds(id)

    // Strip per-row identity keys + per-outlet keys from the fan-out payload.
    const {
      category_id: incomingCatId,
      property_id: _ignoredProp,
      id: _ignoredId,
      is_available: incomingAvail,
      ...shared
    } = data as Record<string, unknown> & {
      category_id?: string
      property_id?: string
      id?: string
      is_available?: boolean
    }

    if (incomingCatId) {
      // Staff moved the item to a different category. Each sibling must get
      // its OWN property's matching category_id — never paste BLR's id into
      // WTF's row.
      const { data: newCat, error: newCatErr } = await supabase
        .from('cafe_menu_categories')
        .select('name')
        .eq('id', incomingCatId as string)
        .single()
      if (newCatErr || !newCat) throw newCatErr || new Error('Category not found')

      const newCatByProp = await buildCategoryIdByPropertyForName(newCat.name as string)

      const { data: sibs, error: sibErr } = await supabase
        .from('cafe_menu_items')
        .select('id, property_id')
        .in('id', sibIds)
      if (sibErr) throw sibErr

      for (const sib of sibs || []) {
        const update = {
          ...shared,
          category_id: newCatByProp.get(sib.property_id as string) ?? (incomingCatId as string),
        }
        const { error } = await supabase
          .from('cafe_menu_items')
          .update(update)
          .eq('id', sib.id)
        if (error) throw error
      }
    } else {
      const { error } = await supabase
        .from('cafe_menu_items')
        .update(shared)
        .in('id', sibIds)
      if (error) throw error
    }

    // is_available is per-outlet: apply ONLY to the source row, never fanned
    // out. (Form pre-fills the switch from the editing row's value, so a
    // no-op edit just rewrites the same value on the same row.)
    if (incomingAvail !== undefined) {
      const { error: availErr } = await supabase
        .from('cafe_menu_items')
        .update({ is_available: incomingAvail })
        .eq('id', id)
      if (availErr) throw availErr
    }

    await fetchData()
  }, [fetchData])

  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    // Per-outlet: CafeZomad is one entity with one standardised menu, but
    // each outlet (BLR, WTF) runs an independent kitchen and inventory. An
    // outlet must be able to hide a menu item from its OWN customer page
    // when it's out of stock or has an exigency, without affecting the
    // other outlet. So availability is per-row, NOT fanned out.
    //
    // Standardised fields (price, image, recipe, macros, etc.) are still
    // fanned out via updateItem.
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
