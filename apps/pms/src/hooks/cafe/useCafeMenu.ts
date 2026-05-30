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
  deleteItem: (id: string) => Promise<void>
  /**
   * Persist a new category order. Pass the full list of canonical category
   * names in the new order; the RPC renumbers sort_order = 0..N-1 across
   * every per-property sibling row so BLR and WTF stay in lock-step.
   */
  reorderCategories: (orderedNames: string[]) => Promise<void>
  /**
   * Persist a new item order within one category. Pass the category's
   * canonical name and the full list of item names in the new order.
   * Renumbering scopes by category-name so other categories aren't touched.
   */
  reorderItems: (categoryName: string, orderedItemNames: string[]) => Promise<void>
}

export function useCafeMenu({ categoryId, propertyId }: UseCafeMenuParams = {}): UseCafeMenuResult {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // `silent` skips the full-page loading spinner. Used after mutations
  // (toggle/create/edit/delete/move) so the UI keeps working while we
  // quietly re-sync. Without this, every action flashes the page back to
  // a spinner and chefs have to wait before doing the next thing.
  const fetchData = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setIsLoading(true)
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

      // Standardised menu = one logical category per name across all
      // outlets. Dedupe by case-insensitive name and remember the canonical
      // (first-seen) id so items linked to any per-property sibling collapse
      // onto the same UI row. Without this the admin saw two "Breakfast"
      // chips (BLR's + WTF's) each with a partial item count.
      const allCats = (catResult.data || []) as MenuCategory[]
      const canonicalCatIdByName = new Map<string, string>()
      const uniqueCats: MenuCategory[] = []
      for (const cat of allCats) {
        const key = cat.name.toLowerCase().trim()
        if (canonicalCatIdByName.has(key)) continue
        canonicalCatIdByName.set(key, cat.id)
        uniqueCats.push(cat)
      }
      setCategories(uniqueCats)

      const nameByCatId = new Map<string, string>()
      for (const cat of allCats) nameByCatId.set(cat.id, cat.name.toLowerCase().trim())

      // When filtering by a (canonical) category id, expand to every per-
      // property sibling sharing that name so items from all outlets show.
      let targetCatIds: string[] | null = null
      if (categoryId) {
        const targetName = nameByCatId.get(categoryId)
        targetCatIds = targetName
          ? allCats.filter((c) => c.name.toLowerCase().trim() === targetName).map((c) => c.id)
          : [categoryId]
      }

      let itemQuery = supabase
        .from('cafe_menu_items')
        .select('*')
        // Hide soft-deleted items from the menu admin listing.
        .is('deleted_at', null)
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

      // Dedupe items by name, then remap each kept row's category_id to the
      // canonical category id so getItemCount(cat.id) in the page still
      // finds them after category dedup.
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
          const canonicalId = catName ? canonicalCatIdByName.get(catName) : undefined
          return canonicalId && canonicalId !== item.category_id
            ? { ...item, category_id: canonicalId }
            : item
        })
      setItems(uniqueItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (!opts.silent) setIsLoading(false)
    }
  }, [categoryId, propertyId])

  useEffect(() => { fetchData() }, [fetchData])

  const createCategory = useCallback(async (name: string) => {
    // Standardised menu: create category for all Zo House properties.
    const { data: properties } = await supabase
      .from('cafe_properties')
      .select('id')
    if (!properties?.length) throw new Error('No properties found')

    // New categories land at the bottom of the list (matches the typical
    // "new things go to the end, you reorder if you want them elsewhere"
    // mental model). sort_order rows that share a name share a number, so
    // taking max() once and using it for every per-property row keeps the
    // standardised order intact.
    const { data: maxRow } = await supabase
      .from('cafe_menu_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextOrder = (maxRow?.sort_order ?? -1) + 1

    const rows = properties.map((p) => ({
      property_id: p.id,
      name,
      is_active: true,
      sort_order: nextOrder,
    }))
    const { error } = await supabase
      .from('cafe_menu_categories')
      .insert(rows)
    if (error) throw error
    await fetchData({ silent: true })
  }, [fetchData])

  const toggleCategory = useCallback(async (id: string, isActive: boolean) => {
    // Standardised menu cascades: toggle every per-property row that shares
    // this category's name (case-insensitive). Both outlets stay in sync.
    const { data: src, error: srcErr } = await supabase
      .from('cafe_menu_categories')
      .select('name')
      .eq('id', id)
      .single()
    if (srcErr || !src) throw srcErr || new Error('Category not found')

    const escaped = String(src.name).replace(/[\\%_]/g, '\\$&')
    const { data: cats, error: catsErr } = await supabase
      .from('cafe_menu_categories')
      .select('id, name')
      .ilike('name', escaped)
    if (catsErr) throw catsErr

    const srcLower = String(src.name).toLowerCase().trim()
    const ids = (cats || [])
      .filter((c) => String(c.name).toLowerCase().trim() === srcLower)
      .map((c) => c.id as string)
    if (!ids.length) ids.push(id)

    const { error } = await supabase
      .from('cafe_menu_categories')
      .update({ is_active: isActive })
      .in('id', ids)
    if (error) throw error
    await fetchData({ silent: true })
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

    // New items land at the bottom of their category — same rationale as
    // createCategory above. Scope max() to the union of per-property rows
    // for THIS category name so the number is meaningful.
    const catIds = matchingCats.map((c) => c.id)
    const { data: maxItem } = await supabase
      .from('cafe_menu_items')
      .select('sort_order')
      .in('category_id', catIds)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextOrder = (maxItem?.sort_order ?? -1) + 1

    const rows = matchingCats.map((cat) => ({
      ...data,
      category_id: cat.id,
      property_id: cat.property_id,
      sort_order: nextOrder,
    }))
    const { data: created, error } = await supabase
      .from('cafe_menu_items')
      .insert(rows)
      .select('id')
    if (error) throw error
    await fetchData({ silent: true })
    // Return the first created item's ID (for recipe saving)
    return created?.[0]?.id ?? null
  }, [fetchData])

  const updateItem = useCallback(async (id: string, data: Record<string, unknown>) => {
    // CafeZomad is one entity with one standardised menu. An edit on one
    // outlet's row must fan out to every sibling row so BLR and WTF stay
    // in lock-step for menu STRUCTURE (name, price, description, recipe,
    // diet, etc.). is_available is deliberately NOT cascaded — each
    // kitchen toggles availability independently via toggleAvailability,
    // because inventory situations are property-local.
    //
    // Sibling = same item name (case-insensitive) AND same category name
    // (case-insensitive). Scoping by category-name prevents touching the
    // FUDR-imported legacy rows kept for order-history sanity that live in
    // archived categories. See lib/cafe/menu-siblings.ts.
    const sibIds = await findSiblingMenuItemIds(id)

    // Strip per-row identity keys AND is_available from the fan-out
    // payload — is_available is property-local; toggleAvailability handles
    // it. Stripping here defends against any code path that includes it
    // in an update.
    const {
      category_id: incomingCatId,
      property_id: _ignoredProp,
      id: _ignoredId,
      is_available: _ignoredAvail,
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

    await fetchData({ silent: true })
  }, [fetchData])

  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    // PER-PROPERTY toggle — does NOT cascade. Each kitchen runs its own
    // inventory and may need to pause an item independently (e.g. BLR is
    // out of eggs today but WTF still has them). Menu structure (items,
    // prices, recipes) stays standardised via createItem/updateItem/
    // deleteItem which DO cascade across properties; only the live
    // availability flag is property-local.
    const { error } = await supabase
      .from('cafe_menu_items')
      .update({ is_available: isAvailable })
      .eq('id', id)
    if (error) throw error
    await fetchData({ silent: true })
  }, [fetchData])

  /**
   * Soft-delete an item across ALL properties (standardised menu rule).
   * Looks up the item's name, finds every row with the same name, and stamps
   * deleted_at = now() on each. Historical orders that reference these rows
   * still resolve (rows are preserved); they just don't appear in menu listings.
   */
  const deleteItem = useCallback(async (id: string) => {
    const { data: sourceItem } = await supabase
      .from('cafe_menu_items')
      .select('name')
      .eq('id', id)
      .single()
    if (!sourceItem?.name) throw new Error('Menu item not found')

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('cafe_menu_items')
      .update({ deleted_at: now })
      .eq('name', sourceItem.name)
      .is('deleted_at', null)
    if (error) throw error
    await fetchData({ silent: true })
  }, [fetchData])

  const reorderCategories = useCallback(
    async (orderedNames: string[]) => {
      const { error } = await supabase.rpc('reorder_cafe_menu_categories', {
        p_name_order: orderedNames,
      })
      if (error) throw error
      await fetchData({ silent: true })
    },
    [fetchData],
  )

  const reorderItems = useCallback(
    async (categoryName: string, orderedItemNames: string[]) => {
      const { error } = await supabase.rpc('reorder_cafe_menu_items', {
        p_category_name: categoryName,
        p_item_name_order: orderedItemNames,
      })
      if (error) throw error
      await fetchData({ silent: true })
    },
    [fetchData],
  )

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
    deleteItem,
    reorderCategories,
    reorderItems,
  }
}
