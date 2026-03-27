import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'

const OPERATOR_TO_PROPERTY: Record<string, string> = {
  BNGHO812: 'BLRxZo',
  BNGS531: 'WTFxZo',
}

export interface OccupancyEntry {
  id: string
  guestname: string
  roomtypeunkid: string
  arrivaldate: string
  departuredate: string
  total: number
  property_id: string
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
        .select('tranunkid, guestname, roomtypeunkid, arrivaldate, departuredate, total, property_id')
        .gte('departuredate', today)
        .order('arrivaldate', { ascending: true })

      if (operatorCode && OPERATOR_TO_PROPERTY[operatorCode]) {
        query = query.eq('property_id', OPERATOR_TO_PROPERTY[operatorCode])
      }

      const { data, error } = await query

      if (error) throw error

      const mapped: OccupancyEntry[] = (data || []).map((row: any) => ({
        id: row.tranunkid,
        guestname: row.guestname || 'Unknown',
        roomtypeunkid: row.roomtypeunkid || '',
        arrivaldate: row.arrivaldate,
        departuredate: row.departuredate,
        total: row.total || 0,
        property_id: row.property_id || '',
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
