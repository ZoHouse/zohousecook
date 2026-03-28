import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'

const OPERATOR_TO_PROPERTY: Record<string, string> = {
  BNGHO812: 'BLRxZo',
  BNGS531: 'WTFxZo',
}

// roomtypeunkid → room name mapping
// BLR: 5415000000000000001-006, WTF: 5558000000000000001-006
const ROOM_MAP: Record<string, { name: string; type: 'private' | 'dorm'; beds: number }> = {
  // BLRxZo (Koramangala)
  '5415000000000000001': { name: 'Bored Room', type: 'private', beds: 1 },
  '5415000000000000002': { name: 'Satoshi', type: 'dorm', beds: 3 },
  '5415000000000000003': { name: 'PUNK Room', type: 'private', beds: 1 },
  '5415000000000000004': { name: '721A', type: 'private', beds: 1 },
  '5415000000000000005': { name: 'Gutter Den', type: 'dorm', beds: 5 },
  '5415000000000000006': { name: 'CC0', type: 'dorm', beds: 4 },
  // WTFxZo (Whitefield)
  '5558000000000000001': { name: '721A', type: 'private', beds: 1 },
  '5558000000000000002': { name: 'Bored Room', type: 'private', beds: 1 },
  '5558000000000000003': { name: 'Satoshi', type: 'private', beds: 1 },
  '5558000000000000004': { name: 'Punk Room', type: 'private', beds: 1 },
  '5558000000000000005': { name: 'Gutter Den', type: 'dorm', beds: 8 },
  '5558000000000000007': { name: 'CC0', type: 'dorm', beds: 8 },
}

export function getRoomInfo(roomtypeunkid: string) {
  return ROOM_MAP[roomtypeunkid] || { name: `Room ${roomtypeunkid?.slice(-3)}`, type: 'dorm' as const, beds: 1 }
}

// All rooms for each property — used by grid to show empty beds
const BLR_ROOMS = ['5415000000000000001', '5415000000000000002', '5415000000000000003', '5415000000000000004', '5415000000000000005', '5415000000000000006']
const WTF_ROOMS = ['5558000000000000001', '5558000000000000002', '5558000000000000003', '5558000000000000004', '5558000000000000005', '5558000000000000007']

export function getAllRoomsForProperty(operatorCode: string | null): string[] {
  if (operatorCode === 'BNGHO812') return BLR_ROOMS
  if (operatorCode === 'BNGS531') return WTF_ROOMS
  return [...BLR_ROOMS, ...WTF_ROOMS]
}

export interface OccupancyEntry {
  id: string
  guestname: string
  roomtypeunkid: string
  roomName: string
  roomType: 'private' | 'dorm'
  roomBeds: number
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

      const mapped: OccupancyEntry[] = (data || []).map((row: any) => {
        const room = getRoomInfo(row.roomtypeunkid)
        return {
          id: row.tranunkid,
          guestname: row.guestname || 'Unknown',
          roomtypeunkid: row.roomtypeunkid || '',
          roomName: room.name,
          roomType: room.type,
          roomBeds: room.beds,
          arrivaldate: row.arrivaldate,
          departuredate: row.departuredate,
          total: row.total || 0,
          property_id: row.property_id || '',
        }
      })

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
