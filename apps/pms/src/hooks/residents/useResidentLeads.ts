import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../configs/supabase'
import type {
  ResidentLead,
  ResidentStage,
  ResidentLeadNote,
  ResidentLeadActivity,
  LeadSource,
} from '../../types/residents'

interface UseResidentLeadsParams {
  property: string | null // "BLRxZo" | "WTFxZo" | null (all)
  source?: LeadSource | null
  assignedTo?: string | null
  stage?: ResidentStage | null
  leadType?: string | null // "resident" | "membership" | null (all)
}

interface UseResidentLeadsResult {
  leads: ResidentLead[]
  leadsByStage: Record<string, ResidentLead[]>
  isLoading: boolean
  refetch: () => Promise<void>
  updateStage: (leadId: string, newStage: ResidentStage, userId?: string | null) => Promise<void>
  createLead: (lead: Partial<ResidentLead>) => Promise<ResidentLead | null>
  updateLead: (leadId: string, updates: Partial<ResidentLead>, userId?: string | null) => Promise<void>
  addNote: (leadId: string, content: string, author?: string) => Promise<void>
  getActivity: (leadId: string) => Promise<ResidentLeadActivity[]>
  getNotes: (leadId: string) => Promise<ResidentLeadNote[]>
}

export function useResidentLeads({
  property,
  source,
  assignedTo,
  stage,
  leadType,
}: UseResidentLeadsParams): UseResidentLeadsResult {
  const [leads, setLeads] = useState<ResidentLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)

    try {
      let query = supabase
        .from('pipeline_leads')
        .select('*')
        .is('deleted_at', null)
        .eq('is_dead', false)
        .order('updated_at', { ascending: false })

      if (property) {
        query = query.eq('property', property)
      }
      if (source) {
        query = query.eq('source', source)
      }
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo)
      }
      if (stage) {
        query = query.eq('stage', stage)
      }
      if (leadType) {
        query = query.eq('lead_type', leadType)
      }

      const { data, error } = await query

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('useResidentLeads fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [property, source, assignedTo, stage, leadType])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Group leads by stage
  const leadsByStage = leads.reduce<Record<string, ResidentLead[]>>((acc, lead) => {
    const s = lead.stage
    if (!acc[s]) acc[s] = []
    acc[s].push(lead)
    return acc
  }, {})

  const updateStage = useCallback(
    async (leadId: string, newStage: ResidentStage, userId?: string | null) => {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      const oldStage = lead.stage
      const now = new Date().toISOString()

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, stage: newStage, stage_changed_at: now, updated_at: now } : l
        )
      )

      try {
        const { error } = await supabase
          .from('pipeline_leads')
          .update({ stage: newStage, stage_changed_at: now, updated_at: now })
          .eq('id', leadId)

        if (error) throw error

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: leadId,
          action: 'stage_changed',
          from_stage: oldStage,
          to_stage: newStage,
          detail: userId ? `Changed by ${userId}` : null,
        })
      } catch (err) {
        console.error('useResidentLeads updateStage error:', err)
        // Rollback optimistic update
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, stage: oldStage } : l))
        )
      }
    },
    [leads]
  )

  const createLead = useCallback(
    async (lead: Partial<ResidentLead>): Promise<ResidentLead | null> => {
      try {
        const { data, error } = await supabase
          .from('pipeline_leads')
          .insert({
            ...lead,
            stage: lead.stage || 'inquiry',
            priority: lead.priority || 'normal',
            is_dead: false,
            is_renewed: false,
            events_attended: lead.events_attended ?? 0,
            total_nights_stayed: lead.total_nights_stayed ?? 0,
          })
          .select()
          .single()

        if (error) throw error

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: data.id,
          action: 'lead_created',
          from_stage: null,
          to_stage: data.stage,
          detail: `Created from ${lead.source || 'manual'}`,
        })

        // Add to local state
        setLeads((prev) => [data, ...prev])
        return data
      } catch (err) {
        console.error('useResidentLeads createLead error:', err)
        return null
      }
    },
    []
  )

  const updateLead = useCallback(
    async (leadId: string, updates: Partial<ResidentLead>, userId?: string | null) => {
      try {
        const { error } = await supabase
          .from('pipeline_leads')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', leadId)

        if (error) throw error

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: leadId,
          action: 'lead_updated',
          from_stage: null,
          to_stage: null,
          detail: `Updated: ${Object.keys(updates).join(', ')}`,
        })

        // Update local state
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
          )
        )
      } catch (err) {
        console.error('useResidentLeads updateLead error:', err)
      }
    },
    []
  )

  const addNote = useCallback(
    async (leadId: string, content: string, author?: string) => {
      try {
        const { error: noteError } = await supabase.from('resident_lead_notes').insert({
          lead_id: leadId,
          content,
          author: author ?? 'system',
        })

        if (noteError) throw noteError

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: leadId,
          action: 'note_added',
          from_stage: null,
          to_stage: null,
          detail: `Note by ${author ?? 'system'}: ${content.slice(0, 100)}`,
        })
      } catch (err) {
        console.error('useResidentLeads addNote error:', err)
      }
    },
    []
  )

  const getActivity = useCallback(async (leadId: string): Promise<ResidentLeadActivity[]> => {
    try {
      const { data, error } = await supabase
        .from('pipeline_lead_activity')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('useResidentLeads getActivity error:', err)
      return []
    }
  }, [])

  const getNotes = useCallback(async (leadId: string): Promise<ResidentLeadNote[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('useResidentLeads getNotes error:', err)
      return []
    }
  }, [])

  return {
    leads,
    leadsByStage,
    isLoading,
    refetch: fetchLeads,
    updateStage,
    createLead,
    updateLead,
    addNote,
    getActivity,
    getNotes,
  }
}
