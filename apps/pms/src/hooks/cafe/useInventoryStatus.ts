import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type {
  IngredientUnit,
  InventoryStatusContext,
  RecipeRow,
} from '../../types/cafe'

interface UseInventoryStatusResult extends InventoryStatusContext {
  isLoading: boolean
}

const EMPTY_CTX: InventoryStatusContext = {
  stockMap: new Map(),
  ingredientMap: new Map(),
  recipeMap: new Map(),
}

/**
 * Fetches inventory + recipe data for the property and subscribes to Realtime
 * changes on cafe_ingredient_stock so kitchen-card indicators update live as
 * other orders deduct stock.
 *
 * Returns three maps usable by computeOrderInventoryStatus:
 *  - stockMap:      ingredient_id → current_stock (in stock unit)
 *  - ingredientMap: ingredient_id → { name, unit }
 *  - recipeMap:     menu_item_id  → recipe rows
 */
export function useInventoryStatus(
  propertyId: string | null,
): UseInventoryStatusResult {
  const [ctx, setCtx] = useState<InventoryStatusContext>(EMPTY_CTX)
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchAll = useCallback(async () => {
    if (!propertyId) {
      setCtx(EMPTY_CTX)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      // 1. Ingredients (id, name, stock unit) — fetched globally because
      //    cafe_ingredients isn't per-property; cheap (few hundred rows max).
      const { data: ingredients } = await supabase
        .from('cafe_ingredients')
        .select('id, name, unit')

      const ingredientMap = new Map<string, { name: string; unit: IngredientUnit }>()
      for (const i of ingredients || []) {
        ingredientMap.set(i.id, { name: i.name, unit: i.unit as IngredientUnit })
      }

      // 2. Stock for THIS property only.
      const { data: stock } = await supabase
        .from('cafe_ingredient_stock')
        .select('ingredient_id, current_stock')
        .eq('property_id', propertyId)

      const stockMap = new Map<string, number>()
      for (const s of stock || []) {
        stockMap.set(s.ingredient_id, Number(s.current_stock))
      }

      // 3. All recipes globally — recipes are not per-property, cheap.
      const { data: recipes } = await supabase
        .from('cafe_recipe_items')
        .select('menu_item_id, ingredient_id, quantity, unit')

      const recipeMap = new Map<string, RecipeRow[]>()
      for (const r of recipes || []) {
        const rows = recipeMap.get(r.menu_item_id) || []
        rows.push({
          ingredientId: r.ingredient_id,
          quantity: Number(r.quantity),
          unit: r.unit as IngredientUnit,
        })
        recipeMap.set(r.menu_item_id, rows)
      }

      setCtx({ stockMap, ingredientMap, recipeMap })
    } catch (err) {
      console.error('useInventoryStatus fetch error:', err)
      setCtx(EMPTY_CTX)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  // Initial + refetch on property change
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Live updates: when cafe_ingredient_stock changes for this property,
  // patch the stockMap in place so visible cards recompute.
  useEffect(() => {
    if (!propertyId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`kitchen-inventory-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafe_ingredient_stock',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = (payload.new as any) || (payload.old as any)
          if (!row?.ingredient_id) return
          setCtx((prev) => {
            const next = new Map(prev.stockMap)
            if (payload.eventType === 'DELETE') {
              next.delete(row.ingredient_id)
            } else {
              next.set(row.ingredient_id, Number(row.current_stock))
            }
            return { ...prev, stockMap: next }
          })
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [propertyId])

  return { ...ctx, isLoading }
}
