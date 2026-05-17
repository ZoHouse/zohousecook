import { supabase } from '../../configs/supabase'
import type { IngredientUnit } from '../../types/cafe'
import { convertUnit } from './unit-conversion'

interface DeductionResult {
  deducted: { ingredient: string; amount: number; unit: string }[]
  skipped: { menuItem: string; reason: string }[]
}

/**
 * Deducts ingredient stock for all active items in an order,
 * based on recipe mappings in cafe_recipe_items.
 *
 * Handles unit conversion between recipe units (g, ml) and
 * stock units (kg, liter, pieces, etc.)
 *
 * Call this when an order transitions to "accepted".
 */
/**
 * Compute the ingredient deductions for an order's active items.
 * Shared by both deduct and restore flows.
 */
async function computeDeductions(orderId: string) {
  // 1. Get active order items
  const { data: orderItems, error: oiErr } = await supabase
    .from('cafe_order_items')
    .select('menu_item_id, quantity, name')
    .eq('order_id', orderId)
    .eq('item_status', 'active')

  if (oiErr || !orderItems?.length) return { orderItems: [], deductions: new Map<string, { amount: number; stockUnit: string; name: string }>(), skipped: [] as { menuItem: string; reason: string }[] }

  // 2. Get all recipe mappings for these menu items (include ingredient's stock unit)
  const menuItemIds = [...new Set(orderItems.map((oi) => oi.menu_item_id))]
  const { data: recipes, error: rErr } = await supabase
    .from('cafe_recipe_items')
    .select('menu_item_id, ingredient_id, quantity, unit, ingredient:cafe_ingredients(name, unit)')
    .in('menu_item_id', menuItemIds)

  const skipped: { menuItem: string; reason: string }[] = []

  if (rErr || !recipes?.length) {
    for (const oi of orderItems) {
      skipped.push({ menuItem: oi.name, reason: 'no recipe' })
    }
    return { orderItems, deductions: new Map<string, { amount: number; stockUnit: string; name: string }>(), skipped }
  }

  // 3. Build deduction map: ingredient_id → total quantity (in stock unit)
  const deductions = new Map<string, { amount: number; stockUnit: string; name: string }>()

  for (const oi of orderItems) {
    const itemRecipes = recipes.filter((r) => r.menu_item_id === oi.menu_item_id)
    if (itemRecipes.length === 0) {
      skipped.push({ menuItem: oi.name, reason: 'no recipe' })
      continue
    }
    for (const r of itemRecipes) {
      const ingredientRaw = r.ingredient as unknown
      const ingredientData = Array.isArray(ingredientRaw)
        ? (ingredientRaw[0] as { name: string; unit: IngredientUnit } | undefined)
        : (ingredientRaw as { name: string; unit: IngredientUnit } | null)

      const ingredientName = ingredientData?.name || 'Unknown'
      const stockUnit = ingredientData?.unit || (r.unit as IngredientUnit)

      // Convert recipe quantity to stock unit
      const converted = convertUnit(
        r.quantity * oi.quantity,
        r.unit as IngredientUnit,
        stockUnit,
      )

      if (converted === null) {
        skipped.push({
          menuItem: oi.name,
          reason: `unit mismatch: ${r.unit} → ${stockUnit} for ${ingredientName}`,
        })
        continue
      }

      const existing = deductions.get(r.ingredient_id)
      if (existing) {
        existing.amount += converted
      } else {
        deductions.set(r.ingredient_id, {
          amount: converted,
          stockUnit,
          name: ingredientName,
        })
      }
    }
  }

  return { orderItems, deductions, skipped }
}

/**
 * Deducts ingredient stock for all active items in an order,
 * based on recipe mappings in cafe_recipe_items.
 *
 * Handles unit conversion between recipe units (g, ml) and
 * stock units (kg, liter, pieces, etc.)
 *
 * Call this when an order transitions to "accepted".
 */
export async function deductInventoryForOrder(
  orderId: string,
  propertyId: string,
): Promise<DeductionResult> {
  const result: DeductionResult = { deducted: [], skipped: [] }
  const { deductions, skipped } = await computeDeductions(orderId)
  result.skipped = skipped

  // 4. Fetch current stock for all affected ingredients at this property
  const ingredientIds = [...deductions.keys()]
  if (ingredientIds.length === 0) return result

  const { data: stockRows } = await supabase
    .from('cafe_ingredient_stock')
    .select('id, ingredient_id, current_stock')
    .eq('property_id', propertyId)
    .in('ingredient_id', ingredientIds)

  const stockMap = new Map(
    (stockRows || []).map((s) => [s.ingredient_id, s])
  )

  // 5. Batch update stock
  for (const [ingredientId, deduction] of deductions) {
    const stock = stockMap.get(ingredientId)
    if (stock) {
      const newStock = Math.max(0, Number((stock.current_stock - deduction.amount).toFixed(4)))
      await supabase
        .from('cafe_ingredient_stock')
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', stock.id)
    } else {
      // No stock row — create one at 0
      await supabase
        .from('cafe_ingredient_stock')
        .upsert({
          ingredient_id: ingredientId,
          property_id: propertyId,
          current_stock: 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'ingredient_id,property_id' })
    }

    result.deducted.push({
      ingredient: deduction.name,
      amount: deduction.amount,
      unit: deduction.stockUnit,
    })
  }

  return result
}

/**
 * Restores ingredient stock when an order is cancelled.
 * Only restores if the order was previously accepted (inventory was deducted).
 *
 * Call this when an accepted/preparing/ready order transitions to "cancelled".
 */
export async function restoreInventoryForOrder(
  orderId: string,
  propertyId: string,
): Promise<DeductionResult> {
  const result: DeductionResult = { deducted: [], skipped: [] }
  const { deductions, skipped } = await computeDeductions(orderId)
  result.skipped = skipped

  const ingredientIds = [...deductions.keys()]
  if (ingredientIds.length === 0) return result

  const { data: stockRows } = await supabase
    .from('cafe_ingredient_stock')
    .select('id, ingredient_id, current_stock')
    .eq('property_id', propertyId)
    .in('ingredient_id', ingredientIds)

  const stockMap = new Map(
    (stockRows || []).map((s) => [s.ingredient_id, s])
  )

  for (const [ingredientId, deduction] of deductions) {
    const stock = stockMap.get(ingredientId)
    if (stock) {
      const newStock = Number((stock.current_stock + deduction.amount).toFixed(4))
      await supabase
        .from('cafe_ingredient_stock')
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', stock.id)

      result.deducted.push({
        ingredient: deduction.name,
        amount: deduction.amount,
        unit: deduction.stockUnit,
      })
    }
    // If no stock row exists, nothing to restore
  }

  return result
}
