// Internal event names (snake_case, past tense for completed actions).
// Mapping to vendor names happens in lib/meta/pixel.ts (Meta) and
// lib/analytics/track.ts (no rename for GA4/PostHog/MoEngage).

export type EventName =
  | "page_view"
  | "scroll_milestone"
  | "village_slot_click"
  | "zo_radio_play"
  | "external_link_click"
  | "vs_ns_section_view"
  | "cta_click"
  | "apply_modal_open"
  | "waitlist_modal_open"
  | "otp_requested"
  | "otp_verified"
  | "otp_failed"
  | "apply_field_focus"
  | "apply_field_blur"
  | "apply_submit_attempt"
  | "apply_submit_success"
  | "apply_submit_error"
  | "identity_collision";

export type CtaPlacement =
  | "hero"
  | "inline"
  | "sticky"
  | "empty_slot"
  | "nav";

export type CtaIntent = "apply" | "waitlist";

export interface EventProps {
  page_view: {
    url: string;
    referrer: string | null;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    search_keyword?: string;
  };
  scroll_milestone: { percent: 25 | 50 | 75 | 100; page_path: string };
  village_slot_click: {
    island: "blr" | "wtf";
    slot_index: number;
    occupied: boolean;
  };
  zo_radio_play: Record<string, never>;
  external_link_click: { destination_url: string; placement: string };
  vs_ns_section_view: { section_id: string };
  cta_click: { placement: CtaPlacement; intent: CtaIntent };
  apply_modal_open: { trigger: "cta" | "deeplink" };
  waitlist_modal_open: { trigger: "cta" | "sticky" | "deeplink" };
  otp_requested: { channel: CtaIntent; phone_country_code: string };
  otp_verified: { channel: CtaIntent };
  otp_failed: { channel: CtaIntent; error_code: string };
  apply_field_focus: { field: string };
  apply_field_blur: { field: string; was_filled: boolean };
  apply_submit_attempt: Record<string, never>;
  apply_submit_success: {
    role: string;
    preferred_property: string;
    has_socials: boolean;
    has_building_text: boolean;
  };
  apply_submit_error: { error_code: string };
  identity_collision: {
    phone_hash: string;
    returned_member_phone_hash: string;
    member_id: string;
  };
}

export type TrackArg<E extends EventName> = EventProps[E] extends Record<
  string,
  never
>
  ? [E]
  : [E, EventProps[E]];
