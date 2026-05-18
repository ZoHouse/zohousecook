import { supabase } from '../../configs/supabase'

/**
 * Finds every "sibling" cafe_menu_items row for the row identified by `id`.
 *
 * A sibling = same item name (case-insensitive) AND same category name
 * (case-insensitive). Constraining to the same category-name is what keeps the
 * fan-out from touching FUDR-imported legacy rows that share a name with the
 * standardised menu but live under archived categories like "Beverages" /
 * "Breakfast". Those rows are kept on disk for order-history sanity and must
 * not be revived by an availability toggle or rewritten by a price edit.
 *
 * The returned list always includes `id` itself.
 *
 * Throws if the source row or its category cannot be found.
 */
export async function findSiblingMenuItemIds(id: string): Promise<string[]> {
  const { data: src, error: srcErr } = await supabase
    .from('cafe_menu_items')
    .select('id, name, category_id')
    .eq('id', id)
    .single()
  if (srcErr || !src) throw srcErr || new Error('Menu item not found')

  const { data: srcCat, error: catErr } = await supabase
    .from('cafe_menu_categories')
    .select('name')
    .eq('id', src.category_id)
    .single()
  if (catErr || !srcCat) throw catErr || new Error('Category not found')

  const srcNameLower = String(src.name).toLowerCase().trim()
  const srcCatNameLower = String(srcCat.name).toLowerCase().trim()

  // PostgREST ilike pattern — escape LIKE wildcards in the name first.
  const escapedName = String(src.name).replace(/[\\%_]/g, '\\$&')

  const { data: candidates, error: candErr } = await supabase
    .from('cafe_menu_items')
    .select('id, name, category_id')
    .ilike('name', escapedName)
    // Don't fan out edits to soft-deleted rows — they're kept on disk for
    // order-history sanity but shouldn't be revived by an update.
    .is('deleted_at', null)
  if (candErr) throw candErr
  if (!candidates?.length) return [id]

  const catIds = [...new Set(candidates.map((c) => c.category_id as string))]
  const { data: cats, error: catsErr } = await supabase
    .from('cafe_menu_categories')
    .select('id, name')
    .in('id', catIds)
  if (catsErr) throw catsErr

  const catNameById = new Map<string, string>(
    (cats || []).map((c) => [c.id as string, String(c.name).toLowerCase().trim()])
  )

  const sibIds = candidates
    .filter(
      (c) =>
        String(c.name).toLowerCase().trim() === srcNameLower &&
        catNameById.get(c.category_id as string) === srcCatNameLower
    )
    .map((c) => c.id as string)

  // Guarantee the source id is in the result, even if the read-back somehow
  // missed it (e.g. RLS edge case).
  if (!sibIds.includes(id)) sibIds.push(id)
  return sibIds
}

/**
 * Map of {property_id → category_id} for every property's row of the given
 * category name. Used by updateItem when staff moves an item to a different
 * category — each sibling needs its OWN property's matching category_id, not
 * the source property's id pasted across.
 */
export async function buildCategoryIdByPropertyForName(
  categoryName: string
): Promise<Map<string, string>> {
  const escaped = categoryName.replace(/[\\%_]/g, '\\$&')
  const { data, error } = await supabase
    .from('cafe_menu_categories')
    .select('id, property_id, name')
    .ilike('name', escaped)
  if (error) throw error
  const lower = categoryName.toLowerCase().trim()
  return new Map(
    (data || [])
      .filter((c) => String(c.name).toLowerCase().trim() === lower)
      .map((c) => [c.property_id as string, c.id as string])
  )
}
