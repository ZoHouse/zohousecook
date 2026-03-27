import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { OccupancyEntry } from '../../types/residents'

// Map operator codes to property filter values
// NOTE: pms_bookings may use different property_id values than "BLRxZo"/"WTFxZo".
// If the filter returns empty results, revisit and check actual property_id values in the table.
const OPERATOR_TO_PROPERTY: Record<string, string> = {
  BNGHO812: 'BLRxZo',
  BNGS531: 'WTFxZo',
}

interface UseOccupancyParams {
  operatorCode: string | null
}

interface UseOccupancyResult {
  entries: OccupancyEntry[]
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useOccupancy({ operatorCode }: UseOccupancyParams): UseOccupancyResult {
  const [entries, setEntries] = useState<OccupancyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOccupancy = useCallback(async () => {
    setIsLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      let query = supabase
        .from('pms_bookings')
        .select('tranunkid, guestname, roomname, arrivaldate, departuredate, total, property_id, bookstatus')
        .gte('departuredate', today)
        .order('arrivaldate', { ascending: true })

      // Apply property filter if operator code is known
      if (operatorCode && OPERATOR_TO_PROPERTY[operatorCode]) {
        query = query.eq('property_id', OPERATOR_TO_PROPERTY[operatorCode])
      }

      const { data, error } = await query

      if (error) throw error

      const mapped: OccupancyEntry[] = (data || []).map((row) => ({
        id: row.tranunkid,
        guestname: row.guestname,
        roomname: row.roomname,
        arrivaldate: row.arrivaldate,
        departuredate: row.departuredate,
        total: row.total,
        property_id: row.property_id,
        status: row.bookstatus,
      }))

      setEntries(mapped)
    } catch (err) {
      console.error('useOccupancy error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [operatorCode])

  useEffect(() => {
    fetchOccupancy()
  }, [fetchOccupancy])

  return { entries, isLoading, refetch: fetchOccupancy }
}
