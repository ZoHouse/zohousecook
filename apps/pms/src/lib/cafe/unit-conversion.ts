import type { IngredientUnit } from '../../types/cafe'

/**
 * Convert a quantity from one unit to another.
 * Recipes use small units (g, ml), stock uses large units (kg, liter).
 * Returns the amount in stockUnit, or null if units are incompatible.
 *
 * Shared by inventory-deduct.ts and inventory-check.ts.
 */
export function convertUnit(
  amount: number,
  recipeUnit: IngredientUnit,
  stockUnit: IngredientUnit,
): number | null {
  if (recipeUnit === stockUnit) return amount

  const toGrams: Partial<Record<IngredientUnit, number>> = {
    g: 1,
    kg: 1000,
  }
  if (toGrams[recipeUnit] != null && toGrams[stockUnit] != null) {
    return (amount * toGrams[recipeUnit]!) / toGrams[stockUnit]!
  }

  const toMl: Partial<Record<IngredientUnit, number>> = {
    ml: 1,
    liter: 1000,
    tsp: 5,
    tbsp: 15,
    cups: 240,
  }
  if (toMl[recipeUnit] != null && toMl[stockUnit] != null) {
    return (amount * toMl[recipeUnit]!) / toMl[stockUnit]!
  }

  const countable: IngredientUnit[] = ['pieces', 'slice']
  if (countable.includes(recipeUnit) && countable.includes(stockUnit)) {
    return amount
  }

  return null
}
