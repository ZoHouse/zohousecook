import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../configs/supabase'
import type {
  CafeIngredientWithStock,
  CreateIngredientRequest,
  UpdateStockRequest,
} from '../../types/cafe'

interface UseIngredientsParams {
  category?: string
  search?: string
  propertyCode?: string
  lowStock?: boolean
  limit?: number
  offset?: number
}

interface UseIngredientsResult {
  ingredients: CafeIngredientWithStock[]
  totalCount: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createIngredient: (data: CreateIngredientRequest) => Promise<CafeIngredientWithStock | null>
  updateIngredient: (id: string, updates: Partial<CreateIngredientRequest & { is_active: boolean }>) => Promise<void>
  updateStock: (ingredientId: string, data: UpdateStockRequest) => Promise<void>
}

export function useIngredients({
  category,
  search,
  propertyCode,
  lowStock,
  limit = 50,
  offset = 0,
}: UseIngredientsParams = {}): UseIngredientsResult {
  const [ingredients, setIngredients] = useState<CafeIngredientWithStock[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('cafe_ingredients')
        .select('*, stock:cafe_ingredient_stock(*, property:cafe_properties(code))', { count: 'exact' })
        .eq('is_active', true)
        .order('name')
        .range(offset, offset + limit - 1)

      if (category) {
        query = query.eq('category', category)
      }
      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error: err, count } = await query

      if (err) throw err

      // Flatten stock entries to include property_code
      const withStock: CafeIngredientWithStock[] = (data || []).map((ing: Record<string, unknown>) => {
        const stockEntries = ((ing.stock as Record<string, unknown>[]) || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          ingredient_id: s.ingredient_id as string,
          property_id: s.property_id as string,
          current_stock: s.current_stock as number,
          min_stock: s.min_stock as number | null,
          updated_at: s.updated_at as string,
          property_code: ((s.property as Record<string, unknown>)?.code as string) || '',
        }))

        // Filter by property if requested
        const filteredStock = propertyCode
          ? stockEntries.filter((s) => s.property_code.toLowerCase() === propertyCode.toLowerCase())
          : stockEntries

        return {
          id: ing.id as string,
          code: ing.code as string,
          name: ing.name as string,
          category: ing.category as string,
          unit: ing.unit as CafeIngredientWithStock['unit'],
          unit_cost_paise: ing.unit_cost_paise as number | null,
          supplier: ing.supplier as string | null,
          is_active: ing.is_active as boolean,
          created_at: ing.created_at as string,
          updated_at: ing.updated_at as string,
          stock: filteredStock,
        }
      })

      // Post-filter low stock if requested
      const filtered = lowStock
        ? withStock.filter((ing) =>
            ing.stock.some((s) => s.min_stock !== null && s.current_stock <= s.min_stock)
          )
        : withStock

      setIngredients(filtered)
      setTotalCount(count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [category, search, propertyCode, lowStock, limit, offset])

  useEffect(() => { fetchData() }, [fetchData])

  const createIngredient = useCallback(async (data: CreateIngredientRequest) => {
    const { data: created, error: err } = await supabase
      .from('cafe_ingredients')
      .insert({
        name: data.name,
        code: data.code || data.name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
        category: data.category,
        unit: data.unit,
        unit_cost_paise: data.unit_cost_paise ?? null,
        supplier: data.supplier ?? null,
        is_active: true,
      })
      .select()
      .single()

    if (err) throw err
    await fetchData()
    return created as unknown as CafeIngredientWithStock
  }, [fetchData])

  const updateIngredient = useCallback(async (
    id: string,
    updates: Partial<CreateIngredientRequest & { is_active: boolean }>,
  ) => {
    const { error: err } = await supabase
      .from('cafe_ingredients')
      .update(updates)
      .eq('id', id)
    if (err) throw err
    await fetchData()
  }, [fetchData])

  const updateStock = useCallback(async (ingredientId: string, data: UpdateStockRequest) => {
    // Upsert — create or update stock entry for this ingredient+property
    const { error: err } = await supabase
      .from('cafe_ingredient_stock')
      .upsert({
        ingredient_id: ingredientId,
        property_id: data.property_id,
        current_stock: data.current_stock,
        min_stock: data.min_stock ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'ingredient_id,property_id',
      })
    if (err) throw err
    await fetchData()
  }, [fetchData])

  return {
    ingredients, totalCount, isLoading, error,
    refetch: fetchData, createIngredient, updateIngredient, updateStock,
  }
}
