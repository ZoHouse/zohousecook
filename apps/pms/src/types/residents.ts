// src/types/residents.ts

// --- Resident Lead Pipeline ---

export type ResidentStage =
  | 'new_inquiry'
  | 'contacted'
  | 'visit_scheduled'
  | 'visited'
  | 'application_sent'
  | 'application_received'
  | 'approved'
  | 'deposit_paid'
  | 'moved_in'
  | 'rejected'
  | 'lost'

export type LeadSource =
  | 'walk_in'
  | 'website'
  | 'referral'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'zo_world'
  | 'event'
  | 'other'

export interface ResidentLead {
  id: string
  property: string | null // "BLRxZo" or "WTFxZo"
  name: string
  phone: string | null
  email: string | null
  instagram: string | null
  source: LeadSource
  stage: ResidentStage
  assigned_to: string | null
  move_in_date: string | null
  duration_months: number | null
  budget_monthly: number | null
  room_preference: string | null
  occupation: string | null
  bio: string | null
  referral_source: string | null
  call_scheduled_at: string | null
  visit_scheduled_at: string | null
  is_dead: boolean
  dead_reason: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ResidentLeadNote {
  id: string
  lead_id: string
  content: string
  created_by: string | null
  created_at: string
}

export type ActivityAction =
  | 'stage_changed'
  | 'note_added'
  | 'lead_created'
  | 'lead_updated'
  | 'call_scheduled'
  | 'visit_scheduled'
  | 'marked_dead'
  | 'revived'

export interface ResidentLeadActivity {
  id: string
  lead_id: string
  action: ActivityAction
  details: Record<string, unknown> | null
  created_by: string | null
  created_at: string
}

// --- Occupancy (pms_bookings) ---

export interface OccupancyEntry {
  id: string
  guestname: string | null
  roomname: string | null
  arrivaldate: string | null
  departuredate: string | null
  total: number | null
  property_id: string | null
  status: string | null
}

// --- Stats ---

export interface ResidentStats {
  totalLeads: number
  byStage: Record<string, number>
  bedsFilled: { blr: number; wtf: number }
  callsDueToday: number
  conversionRate: number
}
