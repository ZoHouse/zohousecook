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
}

interface UseResidentLeadsResult {
  leads: ResidentLead[]
  leadsByStage: Record<string, ResidentLead[]>
  isLoading: boolean
  refetch: () => Promise<void>
  updateStage: (leadId: string, newStage: ResidentStage, userId?: string | null) => Promise<void>
  createLead: (lead: Partial<ResidentLead>) => Promise<ResidentLead | null>
  updateLead: (leadId: string, updates: Partial<ResidentLead>, userId?: string | null) => Promise<void>
  addNote: (leadId: string, content: string, userId?: string | null) => Promise<void>
  getActivity: (leadId: string) => Promise<ResidentLeadActivity[]>
  getNotes: (leadId: string) => Promise<ResidentLeadNote[]>
}

export function useResidentLeads({
  property,
  source,
  assignedTo,
  stage,
}: UseResidentLeadsParams): UseResidentLeadsResult {
  const [leads, setLeads] = useState<ResidentLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)

    try {
      let query = supabase
        .from('resident_leads')
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

      const { data, error } = await query

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('useResidentLeads fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [property, source, assignedTo, stage])

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

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: newStage, updated_at: new Date().toISOString() } : l))
      )

      try {
        const { error } = await supabase
          .from('resident_leads')
          .update({ stage: newStage, updated_at: new Date().toISOString() })
          .eq('id', leadId)

        if (error) throw error

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: leadId,
          action: 'stage_changed',
          details: { from: oldStage, to: newStage },
          created_by: userId ?? null,
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
          .from('resident_leads')
          .insert({
            ...lead,
            stage: lead.stage || 'new_inquiry',
            is_dead: false,
          })
          .select()
          .single()

        if (error) throw error

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: data.id,
          action: 'lead_created',
          details: { source: lead.source, property: lead.property },
          created_by: null,
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
          .from('resident_leads')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', leadId)

        if (error) throw error

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: leadId,
          action: 'lead_updated',
          details: { fields: Object.keys(updates) },
          created_by: userId ?? null,
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
    async (leadId: string, content: string, userId?: string | null) => {
      try {
        const { error: noteError } = await supabase.from('resident_lead_notes').insert({
          lead_id: leadId,
          content,
          created_by: userId ?? null,
        })

        if (noteError) throw noteError

        // Log activity
        await supabase.from('resident_lead_activity').insert({
          lead_id: leadId,
          action: 'note_added',
          details: { preview: content.slice(0, 100) },
          created_by: userId ?? null,
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
        .from('resident_lead_activity')
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
        .from('resident_lead_notes')
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
