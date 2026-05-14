// Mock quests shaped to match the staging response of
// GET /api/v1/passport/quests/ — the "user-facing combined view" that returns
// quest templates with the viewer's nested participations[]. When the endpoint
// lands in prod, this file becomes the contract test for the hook in
// ../hooks/useQuests.ts.
//
// Two top-level categories exist server-side:
//   • Tripper  — travel/property-anchored. Sub-kind lives in `data.kind` and
//                is either "booking" (book a stay/activity) or "geomedia"
//                (be there + capture media).
//   • Creator  — Instagram quest. `data.kind` is "instagram".

export type QuestCategory = 'Tripper' | 'Creator';
export type QuestStatus = 'Live' | 'Draft' | 'Closed';
export type QuestVisibility = 'Assigned' | 'Public' | 'Private';

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

export interface Quest {
  pid: string;
  slug: string;
  category: QuestCategory;
  status: QuestStatus;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  result_declares_at: string | null;
  claim_expires_at: string | null;
  rewards: QuestReward[];
  participations: QuestParticipation[];
  data: QuestData;
}

export interface QuestsListResponse {
  count: number;
  results: Quest[];
}

// Seed dates anchored to "now" so quests stay Live regardless of when the mock
// is read. starts_at is 1h ago; ends_at is +7 days.
const NOW = new Date();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const startsAt = new Date(NOW.getTime() - HOUR).toISOString();
const endsAt = new Date(NOW.getTime() + 7 * DAY).toISOString();

function assignedParticipation(id: string): QuestParticipation {
  return {
    id,
    status: 'Assigned',
    proof_url: '',
    booking_ref_id: null,
    is_paid_subscriber: false,
    qualified_at: null,
    disqualification_reason: '',
    claims: [],
  };
}

export const MOCK_QUESTS: Quest[] = [
  // 1) Creator / Instagram — the canonical Instagram quest.
  {
    pid: 'CRT001',
    slug: 'tag-zo-house-blr-reel',
    category: 'Creator',
    status: 'Live',
    title: 'Tag Zo House in your next reel',
    description:
      'Drop a 15-second reel from Zo House Bangalore. Tag @zo.world and use #zoworld. Best three each week get featured on Zo socials.',
    starts_at: startsAt,
    ends_at: endsAt,
    result_declares_at: null,
    claim_expires_at: null,
    rewards: [{ type: 'xp', amount: 50 }],
    participations: [assignedParticipation('part-crt001')],
    data: {
      kind: 'instagram',
location: { name: 'Zo House Koramangala', lat: 12.9352, lng: 77.6245 },
      instagram: {
        mention: '@zo.world',
        hashtags: ['zoworld', 'zohouse'],
        post_type: 'reel',
        brief: '15s vertical reel from Zo House BLR. Tag @zo.world, use #zoworld.',
      },
    },
  },

  // 2) Tripper / booking — the canonical "go unlock a Zostel" quest (from the
  //    staging example: Unlock Port Blair).
  {
    pid: 'GJ8HXGRF',
    slug: 'unlock-port-blair',
    category: 'Tripper',
    status: 'Live',
    title: 'Unlock Port Blair',
    description:
      'Andaman calls. Your next zostel sits on a beach reef in Port Blair, 1651km from your Bangalore base. Score 0.992 — top match.',
    starts_at: startsAt,
    ends_at: new Date(NOW.getTime() + 30 * DAY).toISOString(),
    result_declares_at: null,
    claim_expires_at: null,
    rewards: [{ type: 'xp', amount: 300 }],
    participations: [assignedParticipation('part-gj8hxgrf')],
    data: {
      kind: 'booking',
location: { name: 'Zostel Port Blair', lat: 11.6234, lng: 92.7265 },
      booking: {
        provider: 'zostel',
        href: 'https://www.zostel.com/destination/port-blair/stay/zostel-port-blair/',
        price: 899,
        destination: 'port-blair',
      },
    },
  },

  // 3) Tripper / booking — short-form, activity-style booking.
  {
    pid: 'TRP002',
    slug: 'pottery-zo-house-blr',
    category: 'Tripper',
    status: 'Live',
    title: 'Pottery workshop at Zo House BLR',
    description:
      'Two hours on the wheel with a local potter. You leave with one piece, fired and glazed by next week.',
    starts_at: startsAt,
    ends_at: new Date(NOW.getTime() + 14 * DAY).toISOString(),
    result_declares_at: null,
    claim_expires_at: null,
    rewards: [{ type: 'xp', amount: 100 }],
    participations: [assignedParticipation('part-trp002')],
    data: {
      kind: 'booking',
location: { name: 'Zo House Koramangala', lat: 12.9352, lng: 77.6245 },
      booking: {
        provider: 'zo',
        href: 'https://zo.xyz/cafe/order',
        price: 600,
        when: { date: new Date(NOW.getTime() + 2 * DAY).toISOString().split('T')[0], start_time: '10:00:00' },
      },
    },
  },

  // 4) Tripper / geomedia — be there + capture.
  {
    pid: 'TRP003',
    slug: 'filter-coffee-vidyarthi-bhavan',
    category: 'Tripper',
    status: 'Live',
    title: 'Filter coffee at Vidyarthi Bhavan',
    description:
      'The masala dosa is the entry ticket. The filter coffee is the prize. One photo of your spread inside the iconic Basavanagudi institution.',
    starts_at: startsAt,
    ends_at: endsAt,
    result_declares_at: null,
    claim_expires_at: null,
    rewards: [{ type: 'xp', amount: 25 }],
    participations: [assignedParticipation('part-trp003')],
    data: {
      kind: 'geomedia',
location: { name: 'Vidyarthi Bhavan, Basavanagudi' },
      geomedia: {
        lat: 12.9426,
        lng: 77.5697,
        radius_m: 200,
        media_kinds: ['photo'],
        prompt: 'One photo of your dosa + filter coffee on the table.',
      },
    },
  },

  // 5) Tripper / geomedia — sunrise window quest.
  {
    pid: 'TRP004',
    slug: 'sunrise-nandi-hills',
    category: 'Tripper',
    status: 'Live',
    title: 'Sunrise from Nandi Hills',
    description:
      'Leave at 4. Be at the peak by 5:45. Catch the sun coming up over the Deccan plateau before the crowd shows up.',
    starts_at: startsAt,
    ends_at: endsAt,
    result_declares_at: null,
    claim_expires_at: null,
    rewards: [{ type: 'xp', amount: 75 }],
    participations: [assignedParticipation('part-trp004')],
    data: {
      kind: 'geomedia',
location: { name: 'Nandi Hills peak' },
      geomedia: {
        lat: 13.3704,
        lng: 77.6837,
        radius_m: 500,
        media_kinds: ['photo'],
        prompt: 'One photo before 7am with the sun in frame.',
      },
    },
  },
];

export const MOCK_QUESTS_RESPONSE: QuestsListResponse = {
  count: MOCK_QUESTS.length,
  results: MOCK_QUESTS,
};

// Narrow helpers — the dock/modal switches on these to pick its body layout.
export function isBookingQuest(q: Quest): q is Quest & { data: BookingQuestData } {
  return q.category === 'Tripper' && (q.data as { kind?: string }).kind === 'booking';
}

export function isGeomediaQuest(q: Quest): q is Quest & { data: GeomediaQuestData } {
  return q.category === 'Tripper' && (q.data as { kind?: string }).kind === 'geomedia';
}

export function isInstagramQuest(q: Quest): q is Quest & { data: InstagramQuestData } {
  return q.category === 'Creator' && (q.data as { kind?: string }).kind === 'instagram';
}
