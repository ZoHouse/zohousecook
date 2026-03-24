import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../configs/supabase'
import type { CafeTable } from '../../types/cafe'

interface UseCafeTablesResult {
  tables: CafeTable[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTable: (data: {
    code: string
    label?: string | null
    area: string
    capacity: number
  }) => Promise<void>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
  updateTable: (id: string, data: Partial<CafeTable>) => Promise<void>
}

export function useCafeTables(propertyId: string | null): UseCafeTablesResult {
  const [tables, setTables] = useState<CafeTable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTables = useCallback(async () => {
    if (!propertyId) {
      setTables([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('cafe_tables')
        .select('*')
        .eq('property_id', propertyId)
        .order('area')
        .order('code')

      if (err) throw err
      setTables(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => { fetchTables() }, [fetchTables])

  const createTable = useCallback(async (data: {
    code: string
    label?: string | null
    area: string
    capacity: number
  }) => {
    if (!propertyId) throw new Error('No property selected')

    // Build qr_data — a URL customers will land on
    const qrData = `https://zozozo.work/cafe/order/${data.code}`

    const { error: err } = await supabase
      .from('cafe_tables')
      .insert({
        property_id: propertyId,
        code: data.code,
        label: data.label || null,
        area: data.area,
        capacity: data.capacity,
        is_active: true,
        qr_data: qrData,
      })
    if (err) throw err
    await fetchTables()
  }, [propertyId, fetchTables])

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    const { error: err } = await supabase
      .from('cafe_tables')
      .update({ is_active: isActive })
      .eq('id', id)
    if (err) throw err
    await fetchTables()
  }, [fetchTables])

  const updateTable = useCallback(async (id: string, data: Partial<CafeTable>) => {
    const { error: err } = await supabase
      .from('cafe_tables')
      .update(data)
      .eq('id', id)
    if (err) throw err
    await fetchTables()
  }, [fetchTables])

  return { tables, isLoading, error, refetch: fetchTables, createTable, toggleActive, updateTable }
}
