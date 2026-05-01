// 7 buckets for POI markers. Each bucket has one color (the dot) + one
// Lucide-style line icon (drawn white over the dot at zoom ≥ 14).
//
// Two inputs feed into bucketing:
//   • Foursquare POIs carry a `category` string (192 distinct values in our
//     cache) — exact-match into FSQ_CATEGORY_BUCKET below.
//   • Airtable POIs only have multi-valued `culture_tags[]` (vibes, not
//     venue types) — walked rare-first against AIRTABLE_TAG_PRIORITY.
//
// Anything unmatched on either side falls back to `place`.

export type BucketId =
  | 'food'
  | 'nature'
  | 'spiritual'
  | 'heritage'
  | 'shopping'
  | 'vibe'
  | 'place';

export interface Bucket {
  id: BucketId;
  label: string;
  /** Dot color on the map. Desaturated to coexist with Mapbox dusk basemap. */
  color: string;
  /**
   * Path `d` attribute for a 24×24 line icon (Lucide style). Drawn in white
   * stroke at the symbol layer above the colored dot. Single-path glyphs only —
   * we render via canvas and `map.addImage`, multi-element SVGs would need
   * full SVG parsing.
   */
  icon: string;
}

// Lucide icons (MIT licensed) — reduced to single-path d-strings where the
// original was multi-element by pre-flattening to a chained M…M…M path.
const ICON_UTENSILS =
  'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7';
const ICON_MOUNTAIN = 'm8 3 4 8 5-5 5 15H2Z';
const ICON_FLAME =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';
const ICON_LANDMARK =
  'M3 22h18M6 18v-4M10 18v-4M14 18v-4M18 18v-4M2 10l10-5 10 5M3 13h18';
const ICON_SHOPPING_BAG =
  'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0';
const ICON_MUSIC =
  'M9 18V5l12-2v13M6 18a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z';
// Place is the catch-all — we use a tiny inner circle as the glyph rather
// than a separate icon, to telegraph "uncategorized" without leaving the
// symbol layer empty.
const ICON_DOT = 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z';

export const BUCKETS: Record<BucketId, Bucket> = {
  food:      { id: 'food',      label: 'Food',      color: '#E0A341', icon: ICON_UTENSILS },
  nature:    { id: 'nature',    label: 'Nature',    color: '#5FAE6F', icon: ICON_MOUNTAIN },
  spiritual: { id: 'spiritual', label: 'Spiritual', color: '#E27431', icon: ICON_FLAME },
  heritage:  { id: 'heritage',  label: 'Heritage',  color: '#6F6FB6', icon: ICON_LANDMARK },
  shopping:  { id: 'shopping',  label: 'Shopping',  color: '#9FA0A4', icon: ICON_SHOPPING_BAG },
  vibe:      { id: 'vibe',      label: 'Vibe',      color: '#C84B97', icon: ICON_MUSIC },
  place:     { id: 'place',     label: 'Place',     color: '#D8D8DC', icon: ICON_DOT },
};

export const BUCKET_IDS: BucketId[] = [
  'food', 'nature', 'spiritual', 'heritage', 'shopping', 'vibe', 'place',
];

// Airtable culture_tag → bucket. Walked top-to-bottom; first hit wins.
// Order is rare-first / specific-first so catch-all tags (Photography,
// Stories & Journals, Design, Travel & Adventure, Follow your Heart) don't
// drown the more specific ones.
// Two-pass: highly-specific tags (spiritual, restaurants, beaches, museums)
// always win first. If none of those hit, fall back to vibe tags
// (Travel & Adventure → nature, Design → heritage, Film Making → vibe).
// Reasoning: a place tagged ['Food', 'Travel & Adventure'] is a restaurant
// worth visiting on a trip — it belongs in food, not nature.
const AIRTABLE_TAG_PRIORITY: Array<{ bucket: BucketId; tags: string[] }> = [
  // --- specific (always-win) ---
  { bucket: 'spiritual', tags: ['Spiritual', 'cultural'] },
  { bucket: 'food', tags: ['Food', 'Food ', 'Drinks'] },
  {
    bucket: 'nature',
    tags: [
      'Nature & Wildlife', 'Nature', 'Beach', 'Park', 'Garden',
      'Trails', 'Trails ', 'Hikes', 'Scenic View', 'Views',
    ],
  },
  {
    bucket: 'heritage',
    tags: [
      'History', 'Architecture', 'Museum', 'Art', 'Art & Entertainment',
      'Exhibitions',
    ],
  },
  {
    bucket: 'vibe',
    tags: [
      'Music & Entertainment', 'Dance & Music', 'Amusement Park',
      'Games', 'Games ',
    ],
  },
  {
    bucket: 'shopping',
    tags: [
      'Shopping', 'Shopping ', 'Market', 'Local Culture',
      'Home & Lifestyle',
    ],
  },
  // --- vibe fallbacks (only if no specific tag matched) ---
  { bucket: 'nature', tags: ['Travel & Adventure', 'Adventure', 'Exploration', 'travel'] },
  { bucket: 'heritage', tags: ['Design'] },
  { bucket: 'vibe', tags: ['Film Making', 'Sports', 'Stadium'] },
];

/** FSQ category strings → bucket. Exact match against the `category` field. */
const FSQ_CATEGORY_BUCKET: Record<string, BucketId> = {
  // food
  'Indian Restaurant': 'food',
  'North Indian Restaurant': 'food',
  'South Indian Restaurant': 'food',
  'Restaurant': 'food',
  'Café': 'food',
  'Coffee Shop': 'food',
  'Bakery': 'food',
  'Pizzeria': 'food',
  'Bar': 'food',
  'Vegan and Vegetarian Restaurant': 'food',
  'Fast Food Restaurant': 'food',
  'Sandwich Spot': 'food',
  'Italian Restaurant': 'food',
  'Asian Restaurant': 'food',
  'Chinese Restaurant': 'food',
  'Grocery Store': 'food',
  'Snack Place': 'food',
  'Hotel Bar': 'food',
  'Ice Cream Parlor': 'food',
  'Tea Room': 'food',
  'Juice Bar': 'food',
  'Diner': 'food',
  'Breakfast Spot': 'food',
  'Beach Bar': 'food',
  'French Restaurant': 'food',
  'Fried Chicken Joint': 'food',
  'Dessert Shop': 'food',
  // nature
  'Mountain': 'nature',
  'Beach': 'nature',
  'Lake': 'nature',
  'River': 'nature',
  'Park': 'nature',
  'Garden': 'nature',
  'Scenic Lookout': 'nature',
  'Hiking Trail': 'nature',
  'Other Great Outdoors': 'nature',
  'Forest': 'nature',
  'Waterfall': 'nature',
  'Farm': 'nature',
  'Campground': 'nature',
  'Zoo': 'nature',
  'Bridge': 'nature',
  'Golf Course': 'nature',
  'Village': 'nature',
  'Town': 'nature',
  'Nature Preserve': 'nature',
  // spiritual
  'Temple': 'spiritual',
  'Hindu Temple': 'spiritual',
  'Buddhist Temple': 'spiritual',
  'Monastery': 'spiritual',
  'Church': 'spiritual',
  'Mosque': 'spiritual',
  'Shrine': 'spiritual',
  'Spiritual Center': 'spiritual',
  // heritage
  'Historic and Protected Site': 'heritage',
  'History Museum': 'heritage',
  'Monument': 'heritage',
  'Art Museum': 'heritage',
  'Museum': 'heritage',
  'Art Gallery': 'heritage',
  'Castle': 'heritage',
  'Palace': 'heritage',
  // vibe
  'Movie Theater': 'vibe',
  'Nightclub': 'vibe',
  'Concert Hall': 'vibe',
  'Theater': 'vibe',
  'Arts and Entertainment': 'vibe',
  'Stadium': 'vibe',
  'Amusement Park': 'vibe',
  'Cricket Ground': 'vibe',
  // shopping
  'Shopping Mall': 'shopping',
  'Market': 'shopping',
  'Plaza': 'shopping',
  'Neighborhood': 'shopping',
  'Miscellaneous Store': 'shopping',
  'Store': 'shopping',
  'Department Store': 'shopping',
  'Mobile Phone Store': 'shopping',
  'Hardware Store': 'shopping',
  'Boutique': 'shopping',
  'Clothing Store': 'shopping',
  'Flea Market': 'shopping',
};

/** Unified POI input — either Airtable or FSQ rows after light normalization. */
export interface BucketInput {
  source: 'airtable' | 'fsq';
  cultureTags?: string[];
  fsqCategory?: string;
}

/** Resolve to a bucket. Falls back to `place` for anything ambiguous. */
export function resolveBucket(p: BucketInput): BucketId {
  if (p.source === 'fsq') {
    return (p.fsqCategory && FSQ_CATEGORY_BUCKET[p.fsqCategory]) || 'place';
  }
  const tags = p.cultureTags || [];
  if (tags.length === 0) return 'place';
  const tagSet = new Set(tags);
  for (const { bucket, tags: list } of AIRTABLE_TAG_PRIORITY) {
    for (const t of list) {
      if (tagSet.has(t)) return bucket;
    }
  }
  return 'place';
}
