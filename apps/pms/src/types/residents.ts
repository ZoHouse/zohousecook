export type ResidentStage =
  | 'inquiry' | 'contacted' | 'call_scheduled' | 'call_done'
  | 'approved' | 'deposit_paid' | 'moved_in' | 'checked_out' | 'alumni'

export const RESIDENT_STAGES: ResidentStage[] = [
  'inquiry', 'contacted', 'call_scheduled', 'call_done',
  'approved', 'deposit_paid', 'moved_in',
]

export const ALL_RESIDENT_STAGES: ResidentStage[] = [
  'inquiry', 'contacted', 'call_scheduled', 'call_done',
  'approved', 'deposit_paid', 'moved_in', 'checked_out', 'alumni',
]

export const RESIDENT_STAGE_LABELS: Record<ResidentStage, string> = {
  inquiry: 'Inquiry',
  contacted: 'Contacted',
  call_scheduled: 'Call Scheduled',
  call_done: 'Call Done',
  approved: 'Approved',
  deposit_paid: 'Deposit Paid',
  moved_in: 'Moved In',
  checked_out: 'Checked Out',
  alumni: 'Alumni',
}

export const RESIDENT_STAGE_COLORS: Record<ResidentStage, string> = {
  inquiry: '#6b7280',
  contacted: '#3b82f6',
  call_scheduled: '#8b5cf6',
  call_done: '#f59e0b',
  approved: '#10b981',
  deposit_paid: '#059669',
  moved_in: '#cfff50',
  checked_out: '#9ca3af',
  alumni: '#6b7280',
}

export type LeadSource =
  | 'founders_dinner' | 'typeform' | 'luma' | 'mini_residency'
  | 'referral' | 'inbound' | 'zostel' | 'manual' | 'meta_ads'

export const SOURCE_LABELS: Record<LeadSource, string> = {
  founders_dinner: 'Founders Dinner',
  typeform: 'Typeform',
  luma: 'Luma Event',
  mini_residency: 'Mini Residency',
  referral: 'Referral',
  inbound: 'Inbound',
  zostel: 'Zostel Guest',
  manual: 'Manual',
  meta_ads: 'Meta Ads',
}

export type LeadPriority = 'hot' | 'normal' | 'cold'

export interface ResidentLead {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  email: string | null
  phone: string | null
  twitter: string | null
  telegram: string | null
  wallet_address: string | null
  what_building: string | null
  last_30_days: string | null
  output_commitment: string | null
  what_you_bring: string | null
  who_makes_you_leave: string | null
  preferred_property: string | null
  referrer: string | null
  portfolio_link: string | null
  stage: ResidentStage
  stage_changed_at: string
  source: LeadSource | null
  assigned_to: string | null
  priority: LeadPriority
  call_scheduled_at: string | null
  call_notes: string | null
  property: string | null
  preferred_duration: string | null
  preferred_room_type: string | null
  target_move_in: string | null
  quoted_price_monthly: number | null
  founder_profile_id: string | null
  events_attended: number
  total_nights_stayed: number
  vibe_score: number | null
  luma_guest_id: string | null
  pms_booking_id: string | null
  is_dead: boolean
  is_renewed: boolean
  deleted_at: string | null
}

export interface ResidentLeadNote {
  id: string
  resident_lead_id: string
  author: string
  content: string
  created_at: string
}

export interface ResidentLeadActivity {
  id: string
  resident_lead_id: string
  action: string
  from_stage: string | null
  to_stage: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
