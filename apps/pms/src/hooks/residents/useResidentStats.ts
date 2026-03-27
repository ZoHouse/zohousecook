import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type { ResidentLead } from '../../types/residents'

interface ResidentStats {
  totalLeads: number
  byStage: Record<string, number>
  bedsFilled: { blr: number; wtf: number }
  callsDueToday: number
  conversionRate: number
}

interface UseResidentStatsParams {
  property: string | null // "BLRxZo" | "WTFxZo" | null (all)
}

interface UseResidentStatsResult extends ResidentStats {
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useResidentStats({ property }: UseResidentStatsParams): UseResidentStatsResult {
  const [stats, setStats] = useState<ResidentStats>({
    totalLeads: 0,
    byStage: {},
    bedsFilled: { blr: 0, wtf: 0 },
    callsDueToday: 0,
    conversionRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)

    try {
      // Fetch all active leads (not deleted, not dead)
      let query = supabase
        .from('pipeline_leads')
        .select('*')
        .is('deleted_at', null)
        .eq('is_dead', false)

      if (property) {
        query = query.eq('property', property)
      }

      const { data: leads, error } = await query

      if (error) throw error

      const allLeads: ResidentLead[] = leads || []
      const totalLeads = allLeads.length

      // Group by stage
      const byStage: Record<string, number> = {}
      for (const lead of allLeads) {
        byStage[lead.stage] = (byStage[lead.stage] || 0) + 1
      }

      // Beds filled: count moved_in per property (query without property filter)
      const { data: movedIn, error: bedsError } = await supabase
        .from('pipeline_leads')
        .select('property')
        .is('deleted_at', null)
        .eq('is_dead', false)
        .eq('stage', 'moved_in')

      if (bedsError) throw bedsError

      const movedInLeads = movedIn || []
      const bedsFilled = {
        blr: movedInLeads.filter((l) => l.property === 'BLRxZo').length,
        wtf: movedInLeads.filter((l) => l.property === 'WTFxZo').length,
      }

      // Calls due today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      let callsQuery = supabase
        .from('pipeline_leads')
        .select('id', { count: 'exact' })
        .is('deleted_at', null)
        .eq('is_dead', false)
        .gte('call_scheduled_at', todayStart.toISOString())
        .lte('call_scheduled_at', todayEnd.toISOString())

      if (property) {
        callsQuery = callsQuery.eq('property', property)
      }

      const { count: callsCount, error: callsError } = await callsQuery

      if (callsError) throw callsError

      // Conversion rate: moved_in / total (within filtered set)
      const movedInCount = byStage['moved_in'] || 0
      const conversionRate = totalLeads > 0 ? (movedInCount / totalLeads) * 100 : 0

      setStats({
        totalLeads,
        byStage,
        bedsFilled,
        callsDueToday: callsCount ?? 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
      })
    } catch (err) {
      console.error('useResidentStats error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [property])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { ...stats, isLoading, refetch: fetchStats }
}
