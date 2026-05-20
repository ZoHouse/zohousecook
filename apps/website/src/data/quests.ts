// User-facing GET /api/v1/passport/quests/ response — verified live on prod
// 2026-05-21 via the seeded Creator × Other quest. The public serializer
// emits exactly these top-level keys: pid, slug, category, status, title,
// description, cover_image, destination, operator, inventory, rewards,
// participations. The CAS admin endpoint adds more fields (data JSONB,
// sub_category, starts_at, ends_at, ...); those are NOT on the public
// response and the frontend must not depend on them.

// Tribemaker is defined in the backend admin enum but no Tribemaker quest is
// active in production — keep the public type to what the lobby actually
// renders. Add 'Tribemaker' here (and a matching ROLE_THEMES entry) when the
// first Tribemaker quest ships.
export type QuestCategory = 'Tripper' | 'Creator';
export type QuestStatus =
  | 'Active'
  | 'Inactive'
  | 'Draft'
  | 'Archived'
  | 'Live'
  | 'Closed';
export type QuestVisibility = 'Global' | 'Assigned' | 'Public' | 'Private';

export type ParticipationStatus =
  | 'Assigned'
  | 'Submitted'
  | 'Qualified'
  | 'Disqualified'
  | 'Claimed';

export interface QuestReward {
  type: string;
  amount?: number;
  label?: string;
  [key: string]: unknown;
}

// === Optional `data` JSONB types ===
// Shapes returned by the CAS admin endpoint only. The user-facing endpoint
// strips `data` entirely; do NOT assume `quest.data` is populated on quests
// fetched from /api/v1/passport/quests/. Use the `has*Data` predicates
// below before reading nested fields.

interface CommonQuestData {
  cover_image?: string;
  location?: { name: string; lat?: number; lng?: number };
}

export interface BookingQuestData extends CommonQuestData {
  kind: 'booking';
  booking: {
    provider: 'zostel' | 'zo';
    href: string;
    price?: number;
    property_pid?: string;
    destination?: string;
    when?: { date: string; start_time?: string };
  };
}

export interface GeomediaQuestData extends CommonQuestData {
  kind: 'geomedia';
  geomedia: {
    lat: number;
    lng: number;
    radius_m: number;
    media_kinds: Array<'photo' | 'video' | 'audio'>;
    prompt: string;
  };
}

export interface InstagramQuestData extends CommonQuestData {
  kind: 'instagram';
  instagram: {
    handle?: string;
    hashtags?: string[];
    mention?: string;
    post_type?: 'reel' | 'post' | 'story';
    brief: string;
  };
}

export type QuestData =
  | BookingQuestData
  | GeomediaQuestData
  | InstagramQuestData
  | Record<string, never>;

export interface QuestParticipation {
  id: string;
  status: ParticipationStatus;
  proof_url: string;
  booking_ref_id: string | null;
  is_paid_subscriber: boolean;
  qualified_at: string | null;
  disqualification_reason: string;
  claims: unknown[];
}

// Nested reference objects the user-facing serializer attaches.
export interface QuestDestinationRef {
  id: string;
  name: string;
  code: string;
  slug: string;
}

export interface QuestOperatorRef {
  id: string;
  pid: string;
  name: string;
}

export interface QuestInventoryRef {
  id: string;
  pid: string;
  name: string;
  slug?: string;
}

export interface Quest {
  pid: string;
  slug: string;
  category: QuestCategory;
  status: QuestStatus;
  title: string;
  description: string;
  cover_image: string | null;
  destination: QuestDestinationRef | null;
  operator: QuestOperatorRef | null;
  inventory: QuestInventoryRef | null;
  rewards: QuestReward[];
  participations: QuestParticipation[];

  // CAS-only fields. Treat as undefined on user-facing responses.
  starts_at?: string | null;
  ends_at?: string | null;
  result_declares_at?: string | null;
  claim_expires_at?: string | null;
  data?: QuestData;
}

export interface QuestsListResponse {
  count: number;
  results: Quest[];
}

/**
 * Title fallback that mirrors what the backend actually populates. Use this
 * in every UI surface so quests with empty title still render something
 * readable instead of a blank tile.
 */
export function questDisplayTitle(q: Quest): string {
  return q.title || q.inventory?.name || q.destination?.name || q.slug;
}

// === Archetype predicates — FK-tuple based ===
//
// Quest archetype is derived from the (category, operator, inventory,
// destination) presence tuple — fields the user-facing serializer actually
// returns. These predicates do NOT narrow `data`; use them for routing and
// CTA selection. For per-kind content rendering, pair with the matching
// has*Data predicate below.
//
//   Creator + null FKs            → Instagram share
//   Creator + destination only    → Creator @ place (future)
//   Tripper + destination only    → Tripper geomedia
//   Tripper + operator            → Tripper stay booking
//   Tripper + inventory           → Tripper trip booking

export function isInstagramQuest(q: Quest): boolean {
  return (
    q.category === 'Creator' &&
    !q.destination &&
    !q.operator &&
    !q.inventory
  );
}

export function isGeomediaQuest(q: Quest): boolean {
  return (
    q.category === 'Tripper' &&
    !!q.destination &&
    !q.operator &&
    !q.inventory
  );
}

export function isBookingQuest(q: Quest): boolean {
  return q.category === 'Tripper' && (!!q.operator || !!q.inventory);
}

// === Content-shape predicates — narrow `data` to the matching JSONB ===
//
// Use these only on CAS-bound surfaces (or once a backend change exposes
// `data` to the public endpoint). They return false on standard user-facing
// quests where `data` is stripped.

export function hasInstagramData(
  q: Quest,
): q is Quest & { data: InstagramQuestData } {
  return q.data !== undefined && (q.data as { kind?: string }).kind === 'instagram';
}

export function hasGeomediaData(
  q: Quest,
): q is Quest & { data: GeomediaQuestData } {
  return q.data !== undefined && (q.data as { kind?: string }).kind === 'geomedia';
}

export function hasBookingData(
  q: Quest,
): q is Quest & { data: BookingQuestData } {
  return q.data !== undefined && (q.data as { kind?: string }).kind === 'booking';
}
