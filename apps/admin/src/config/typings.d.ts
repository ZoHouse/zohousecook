import { GeneralObject } from "@zo/definitions/general";

export interface AllowList {
  id: string;
  status: string;
  name: string;
  description: string;
  num_spots: number;
  max_application_spots: number;
  start_time: string | null;
  end_time: string | null;
  data: Record<string, any>;
}

export interface CASAllowListResponse {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  num_spots: number;
  max_application_spots: number;
  start_time: string | null;
  end_time: string | null;
  data: Record<string, any>;
  merkle_root: string;
}

export interface CASDestinationResponse {
  name: string;
  twitter_handle: string;
  id: string;
  email: string;
  code: string;
  local_currency: string;
  coordinates: Coordinate;
  timezone: string;
  media: Media[];
  country: {
    name: string;
    id: string;
    code: string;
    local_currency: string;
  };
}

export interface CASEligibilityResponse {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  tokens_required: Record<string, number>;
  data: Record<string, any>;
  allowlist: string;
}

export interface CASSpaceByFloorResponse {
  id: string;
  category: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  data: Record<string, any>;
  floor: Floor;
}

export interface Currency {
  id: string;
  code: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  decimals: number;
  symbol: string;
}

export interface Destination {
  id: string;
  name: string;
  code: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  coordinates: Coordinate;
}

export interface Floor {
  id: string;
  name: string;
  code: string;
  estate: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ZoHouse {
  id: string;
  destination: Destination;
  status: string;
  features: string[];
  inclusions: any[];
  exclusions: any[];
  faqs: any[];
  vendors: any[];
  media: Media[];
  created_at: string;
  updated_at: string;
  pid: string;
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  data: any;
  policy: any;
  cancellation_policy: any;
  currency: Currency;
  estate: {
    id: string;
    name: string;
    code: string;
  };
  alt_name: string;
}

export interface Feature {
  id: string;
  description: string;
  icon: IconName;
  isSelected?: boolean;
  name: string;
}

export interface Room {
  operator: string | null;
  category: string;
  type: string;
  status: string;
  name: string;
  description: string;
  applicable_taxes: string[];
  tax_category: string;
  vendor: null;
}

export interface Inclusion {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface Exclusion {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface Highlight {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface Itinerary {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  title: string;
  description: string;
  day: number;
  start_at: string | null;
  end_at: string | null;
  location: string;
  notes: string;
  itinerary: string;
  destination: string | null;
  media: Media[];
}

export interface Essential {
  id: string;
  sort_index: number;
  name: string;
  description: string;
  icon: string;
}

export interface Inventory {
  id: string;
  category: string;
  subcategory: string;
  type: string;
  status: string;
  tax_category: string;
  features: string[];
  inclusions?: Inclusion[];
  exclusions?: Exclusion[];
  faqs?: any[];
  media: Media[];
  created_at: string;
  updated_at: string;
  pid: string;
  sort_index?: number;
  name: string;
  description: string;
  data: any;
  occupancy?: number;
  applicable_taxes: string[];
  operator: string;
  vendor: null | any;
  start_at: string | null;
  end_at: string | null;
  skus: Sku[];
  questionnaire: CASQuestionnaire;
  data: {
    subcategory: string;
    price: string;
    latitude: number;
    location: string;
    longitude: number;
    navigation_link: string;
    registration_link: string;
    icon: string;
  };
  node: Node;
  hosts: { id: string; inventory: string; host: Host }[];
  destinations: Destination[];
  short_description: string;
  description: string;
  itinerary: Itinerary[];
  highlights: Highlight[];
  essentials: Essential[];
  is_international: boolean;
  currency: Currency;
  rate_plans?: RatePlan[];
  units?: number;
  availability?: {
    date: string;
    units: number;
    price: number;
    currency: Currency;
  }[];
  pricing?: {
    date: string;
    price: number;
    currency: Currency;
    sellable: boolean;
    rate_plan: string;
    rate_definition_single: string;
    min_bookable_nights: number;
    max_bookable_nights: number;
    checkin_blocked: boolean;
    checkout_blocked: boolean;
    min_days_before_checkin: number;
    max_days_before_checkin: number;
    adult_occupancy: number;
    child_occupancy: number;
    extra_adult_prices: any[];
    extra_child_prices: any[];
  }[];
}

export interface SelectionsInventory {
  id: string;
  pid?: string;
  category: string;
  name: string;
  units: number;
  occupancy: number;
  units: number;
  currency: Currency;
  rate_plans: RatePlan[];
  availability: SelectionsInventoryAvailability[];
  pricing: SelectionsInventoryPricing[];
}

export interface RatePlan {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: Currency;
  label_public: string;
  label_private?: string;
  status: string;
  pid?: string;
  channel_ref_id?: string;
  meal_codes?: string[];
  created_at?: string;
  updated_at?: string;
  inventory?: string;
  max_bookable_units?: number | null;
  min_bookable_units?: number | null;
}

export interface SelectionsInventoryPricing {
  price: number;
  sellable: boolean;
  date: string;
  rate_plan: string;
  rate_definition_single: number;
  min_bookable_nights: number;
  max_bookable_nights: number | null;
  checkin_blocked: boolean;
  checkout_blocked: boolean;
  min_days_before_checkin: number | null;
  max_days_before_checkin: number | null;
  adult_occupancy: number;
  child_occupancy: number;
  extra_adult_prices: number[];
  extra_child_prices: number[];
}

export interface SelectionsInventoryAvailability {
  date: string;
  units: number;
}

export interface Media {
  media_relation_id: string;
  status: string;
  id: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  metadata: {
    alt?: string;
    title?: string;
    description?: string;
    priority?: number;
  };
}

export interface Space {
  id: string;
  name: string;
  code: string;
  category: string;
  floor: {
    id: string;
    name: string;
    code: string;
    estate: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface Sku {
  operator?: string;
  id: string;
  features: any[];
  inclusions: any[];
  exclusions: any[];
  faqs: any[];
  eligibility_criteria: number[];
  media: any[];
  created_at: string;
  updated_at: string;
  pid: string;
  name: string;
  specifications: Record<string, any>;
  data: Record<string, any>;
  price: number;
  slabs: any[];
  units: number;
  sellable: boolean;
  inventory: Inventory;
  space: Space;
  has_infinite_units: boolean;
  occupancy?: number;
  currency: Currency;
}

export interface TripAddon {
  id: string;
  name: string;
  prices: Array<{
    date: string;
    price: number;
    price_taxed: number;
    currency: {
      id: string;
      name: string;
      code: string;
      decimals: number;
      symbol: string;
    };
    price_id: string;
    tax: {
      category: string;
      currency: {
        id: string;
        name: string;
        code: string;
        decimals: number;
        symbol: string;
      };
      country_tax: number;
      country_tax_percent: number;
      state_tax: number;
      state_tax_percent: number;
      tax_amount: number;
    };
  }>;
}

export interface TripAddonPrice {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  date: string;
  x;
  price: number;
  applicable_from: string;
  applicable_till: string;
  addon: Addon;
}

export interface TripsSku {
  id?: string;
  pid: string;
  date: string;
  price?: number;
  currency?: Currency;
  units?: number;
  sellable?: boolean;
  strike_price?: number;
  strike_price_taxed?: number;
  price_taxed?: number;
  labels?: Array<{ name: string; discount: number }>;
  tax?: {
    category: string;
    currency: Currency;
    country_tax: number;
    country_tax_percent: number;
    state_tax: number;
    state_tax_percent: number;
    tax_amount: number;
  };
  strike_tax?: {
    category: string;
    currency: Currency;
    country_tax: number;
    country_tax_percent: number;
    state_tax: number;
    state_tax_percent: number;
    tax_amount: number;
  };
  tcs_rates?: any;
}

export interface TripsSku {
  id: string;
  media: Media[];
  created_at: string;
  updated_at: string;
  pid: string;
  name: string;
  specifications: GeneralObject;
  data: GeneralObject;
  price: number;
  slabs: GeneralObject[];
  units: number;
  sellable: boolean;
  inventory: Inventory;
  space: GeneralObject;
  eligibility_criteria: any[];
  currency: Currency;
}

export interface SkuPricing {
  id: number;
  created_at: string;
  updated_at: string;
  date: string;
  price: number;
  slabs: any[];
  sku: string;
}

export interface SkuAvailability {
  pid: string;
  date: string;
  units: number;
  sellable: boolean;
}

export interface Customer {}

export interface Customer {
  id: string;
  gender: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  address: string;
  kyc: {
    document_back?: {
      id: string;
      url: string;
      category: string;
      metadata: {
        document_side: string;
        document_type: string;
      };
    };
    document_type?: string;
    document_front?: {
      id: string;
      url: string;
      category: string;
      metadata: {
        document_side: string;
        document_type: string;
      };
    };
  };
  data: Record<string, any>;
  booking: string;
  nationality?: GeneralObject;
  user: User;
  date_of_birth?: string;

  address?: string;
}

export interface PFPMetadata {
  contract_address: string;
  token_id: string;
  metadata: string;
  is_valid: string;
}

export interface User {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  email_address: string;
  wallet_address: string;
  mobile_number: string;
  nickname: string;
  membership: string;
  pfp_image: string;
  twitter_handle: string;
  cultures: {
    id: string;
    created_at: string;
    updated_at: string;
    key: string;
    name: string;
    description: string;
    icon: string;
  }[];
  avatar: {
    image: string;
    metadata: string;
  };
}

export interface CASUserResponse {
  id: string;
  web3_wallets: Array<{
    id: number;
    address_type: string;
    created_at: string;
    updated_at: string;
    primary: boolean;
    verified: boolean;
    wallet_address: string;
    is_delegate: boolean;
    is_custodial: boolean;
    user: string;
    delegated_by: string | null;
  }>;
  mobiles: Array<{
    id: number;
    created_at: string;
    updated_at: string;
    primary: boolean;
    verified: boolean;
    mobile_country_code: string;
    mobile_number: string;
    has_whatsapp: boolean;
    dnd: boolean;
    user: string;
  }>;
  emails: Array<{
    id: number;
    verification_type: string;
    created_at: string;
    updated_at: string;
    primary: boolean;
    verified: boolean;
    email_address: string;
    verifier_platform_ref_id: string;
    dnd: boolean;
    promotional: boolean;
    user: string;
  }>;
  profile: Profile;
  created_at: string;
  updated_at: string;
  membership: string;
  scheduled_erase: boolean;
  verified: boolean;
  merged_into: string | null;
  founder_token_ids: any[];
}
export interface EventGuest {
  id: string;
  pid: string;
  status: string;
  start_date: string;
  end_date: string;
  start_at: string | null;
  end_at: string | null;
  user: User;
  customers: Customer[];
}

export interface Wallet {
  id: number;
  address_type: string;
  created_at: string;
  updated_at: string;
  primary: boolean;
  verified: boolean;
  wallet_address: string;
  is_delegate: boolean;
  user: string;
}

export interface Spot {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  merkle_proof: any[]; // Assuming it's an array of any type
  wlist: string;
  wallet: Wallet;
}

export interface CASFounderTokensOwnerResponse {
  tokens: GeneralObject;
  user: User | null;
  num_tokens: number;
}

export interface FounderTokenMetadataAttribute {
  value: string;
  trait_type: string;
}

export interface FounderTokenMetadata {
  name: string;
  image_url: string;
  attributes: FounderTokenMetadataAttribute[];
  animation_url: string;
  static_image_url: string;
}

export interface FounderToken {
  id: string;
  created_at: string;
  updated_at: string;
  platform: number;
  collection: string;
  token_ref_id: string;
  wallet_address: string;
  transaction_hash: string;
  contract_ref_address: string;
  from_address: string;
  metadata: FounderTokenMetadata;
}

export interface SocialMetaData {
  id: string;
  name: string;
  username: string;
  verified: boolean;
  protected: boolean;
  created_at: string;
  description: string;
  public_metrics: {
    tweet_count: number;
    listed_count: number;
    followers_count: number;
    following_count: number;
  };
  pinned_tweet_id: string;
  profile_image_url: string;
}

export interface Social {
  id: number;
  category: string;
  created_at: string;
  updated_at: string;
  link: string;
  verified: boolean;
  data: SocialMetaData;
  profile: string;
}

export interface Booked_SKUS {
  id: number;
  status: string;
  customers: string[];
  offer: {
    id: number;
    pid: string;
    name: string;
    status: string;
    currency: Currency;
    discount_type: string;
    discount_value: number;
    max_discount_value: number;
  };
  created_at: string;
  updated_at: string;
  date: string;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_details: {
    category: string;
    currency: Currency;
    tax_amount: number;
    country_tax: number;
    country_tax_percent: number;
  };
  data: object;
  booking: string;
  sku: Sku;
}

export interface Booking {
  id: string;
  status: string;
  booked_skus: Booked_SKUS[];
  offers: number[];
  total_amount: number;
  final_amount: number;
  offer_discount: number;
  due_amount: number;
  inventory_types: string[];
  payments: {
    id: string;
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    client_reference_id: string;
    order_description: string;
    status: string;
    payment_mode: string;
    product_id: string;
    amount: number;
    hash: string;
    created_at: string;
    updated_at: string;
    merchant: string;
    intent: number;
    success_at: string | null;
    reason: string;
    merchant_response: object;
    refunded: boolean;
    booking: string;
    currency: string;
    related_to: string | null;
  }[];
  kyc_documents: {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    slug: string;
  }[];
  created_at: string;
  updated_at: string;
  pid: string;
  source: string;
  start_at: string;
  end_at: string;
  started_at: string | null;
  ended_at: string | null;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_amount: number;
  advance_amount: number;
  paid_amount: number;
  refund_amount: number;
  data: object;
  customer_notes: string;
  guest_notes: string;
  internal_notes: string;
  cancelled_at: string | null;
  cancellation_reason: string;
  client: string;
  coupon: string | null;
  currency: string;
  operator: string;
  customers: Customer[];
  user: User;
  reserved_by: User;
}

export interface Web3Wallet {
  id: number;
  address_type: string;
  created_at: string;
  updated_at: string;
  primary: boolean;
  verified: boolean;
  wallet_address: string;
  is_delegate: boolean;
  user: string;
}

export interface Profile {
  twitter_handle: any;
  user: User;
  nickname: string;
  selected_nickname: string;
  gender: string | null;
  relationship_status: string | null;
  pfp: ProfilePFP;
  socials: Social[];
  founder_tokens: FounderToken[];
  created_at: string;
  updated_at: string;
  pid: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string | null;
  bio: string;
  address: string;
  ens_nickname: string;
  custom_nickname: string | null;
  tags: string[];
  avatar: {
    image: string;
  };
  pfp_image?: string;
  country: Country;
}

export type ProfilePFP = {
  id: string | number;
  created_at: string;
  updated_at: string;
  contract_ref_address: string;
  token_ref_id: string;
  metadata: GeneralObject;
  image: string;
  video?: string;
};

export interface Estate {
  id: string;
  location: Coordinate;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  data: any;
  accessible_distance: number;
}

export interface Price {
  pid: string;
  date: string;
  strike_price: number;
  strike_price_taxed: number;
  price: number;
  price_taxed: number;
  labels: Array<{ name: string; discount: number }>;
  currency: Currency;
}

export type Country = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  data: {};
  local_currency: string;
};

export type Coordinate = {
  type: string;
  coordinates: number[];
};

export type Visitor = {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  email_address: string;
  wallet_address: string;
  nickname: string;
  membership: string;
  pfp_image: string;
  twitter_handle: string;
};

export type CASVisitorResponse = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  checkin_time: string;
  checkout_time: string | null;
  purpose: string;
  visitor: Visitor;
  estate: Estate;
  space: Space | null;
  booking: Booking | null;
};

type Sale = {
  id: string;
  created_at: string;
  updated_at: string;
  platform: number;
  collection: string;
  token_ref_id: string;
  wallet_address: string;
  transaction_hash: string;
  contract_ref_address: string;
  from_address: string;
  metadata: Metadata;
};

type MostRecentSale = {
  total_nfts_minted: number;
  total_holding_wallets: number;
  multiple_token_holding_wallets: number;
  total_holders: number;
  multiple_token_holders: number;
  most_recent_sale: Sale;
};

export type CASFounderStatsResponse = {
  total_nfts_minted: number;
  total_holding_wallets: number;
  multiple_token_holding_wallets: number;
  total_holders: number;
  multiple_token_holders: number;
  most_recent_sale: MostRecentSale;
  verified_founder_telegram_accounts: number;
  verified_founder_twitter_accounts: number;
};

export type AccessGroup = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  role: string;
  app: string;
};

export type CASUserAccesGroupResponse = {
  id: number;
  user: User;
  created_at: string;
  updated_at: string;
  access_group: number;
};

export type CASBulletinBoardResponse = {
  id: string;
  visibility: string;
  status: string;
  banner: null;
  tags: [];
  created_at: string;
  updated_at: string;
  title: string;
  description: "";
  data: any;
  created_by: User;
};

export type PublicMetrics = {
  like_count: number;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  bookmark_count: number;
  impression_count: number;
};

export type CASBulletinsResponse = {
  id: string;
  status: string;
  media: any[];
  tweet_context: {
    url: string;
    author_ref_user: {
      pid: string;
      membership: string;
      first_name: string;
      last_name: string;
      nickname: string;
      pfp_image: string;
    };
  };
  tags: any[];
  created_at: string;
  updated_at: string;
  title: string;
  content: {
    tweet: {
      id: string;
      lang: string;
      text: string;
      includes: {
        users: {
          id: string;
          url: string;
          name: string;
          username: string;
          verified: boolean;
          profile_image_url: string;
        }[];
        tweets: {
          id: string;
          lang: string;
          text: string;
          author_id: string;
          created_at: string;
          conversation_id: string;
          edit_history_tweet_ids: string[];
        }[];
        media: { url: string }[];
      };
      entities: {
        urls: {
          end: number;
          url: string;
          start: number;
          media_key?: string;
          display_url?: string;
          expanded_url?: string;
          title?: string;
          status?: number;
          description?: string;
          unwound_url?: string;
        }[];
        hashtags: {
          end: number;
          tag: string;
          start: number;
        }[];
        mentions?: {
          id: string;
          end: number;
          start: number;
          username: string;
        }[];
        annotations: {
          end: number;
          type: string;
          start: number;
          probability: number;
          normalized_text: string;
        }[];
      };
      author_id: string;
      created_at: string;
      attachments: {
        media_keys: string[];
      };
      conversation_id: string;
      referenced_tweets?: {
        id: string;
        type: string;
      }[];
      edit_history_tweet_ids: string[];
      public_metrics: PublicMetrics;
    };
  };
  data: {
    tweet_url: string;
    num_attempts: number;
  };
  board: {
    id: string;
    visibility: string;
    status: string;
    title: string;
    tags: string[];
  };
  created_by: {
    id: string;
    pid: string;
    first_name: string;
    last_name: string;
    email_address: string;
    wallet_address: string;
    nickname: string;
    membership: string;
    pfp_image: string;
    twitter_handle: string;
    cultures: string[];
    avatar: any;
  };
};

export type FounderDetails = {
  id: 53;
  user: User;
  created_at: string;
  updated_at: string;
  name: string;
  mobile_number: string;
  email: string;
  data: any;
};

export type Features = {
  icon: IconName;
  name: string;
  description: string;
};

export interface AmenityFeatureRelation {
  id: number;
  created_at: string;
  updated_at: string;
  sort_index: number;
  relation_type: number;
  relation_id: string;
  feature: AmenityFeature;
}

export interface AmenityFeature {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  icon: string;
}

export type CASFeaturesResponse = {
  icon: IconName;
  name: string;
  description: string;
  id: string;
};

export type Artist = {
  id: string;
  pfp: string;
  banner: string;
  tags: string;
  [];
  created_at: string;
  updated_at: string;
  pid: string;
  sort_index: string;
  data: {};
  name: string;
  bio: string;
  wallet_address: string;
  ens: string;
  username: string;
  twitter_username: string;
  url: string;
};

export type Art = {
  id: number;
  created_at: string;
  updated_at: string;
  contract_ref_address: string;
  token_ref_id: string;
  metadata: {
    name: string;
    image: string;
    attributes: { value: string; trait_type }[];
    description: string;
  };
  image: string;
  video: string;
};

export type CASShowcaseArtistResponse = {
  id: string;
  artist: Artist;
  collection: string;
  null;
  art: Art;
  status: string;
  created_at: string;
  updated_at: string;
  data: {};
};

export type CASShowcaseDisplaySessionResponse = {
  id: string;
  status: string;
  showcase_type: string;
  created_at: string;
  updated_at: string;
  token: string;
  data: {
    refresh_rate: number;
    max_art_per_screen: number;
    filter_ids: string[];
    display_orientation: string;
  };
  display: {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    data: {};
    space: CASSpaceByFloorResponse;
  };
};

export type CASShowcaseDisplayResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  data: string;
  space: string;
};

export type CASLocationPropAreaResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  desc: string;
  area_type: Number;
  data: {};
  floor: string;
};

export type CASLocationPropResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  data: {};
};

export type CASLocationPropFloorsResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  data: {};
  prop: string;
};

export type CASDiscoverPricing = {
  pid: string;
  date: string;
  strike_price: number;
  strike_price_taxed: number;
  price: number;
  price_taxed: number;
  labels: string[];
  currency: Currency;
};

export type CommsAccount = {
  id: string;
  profile: {
    nickname: string;
    name: string;
    pfp: string;
    bio: string;
    data: object;
    created_at: string;
    updated_at: string;
  };
};

export type CommsThread = {
  id: string;
  category: "group-chat" | "direct-message";
  title: string;
  description: string;
  icon: string;
  created_by: CommsAccount | null;
  application: CommsApplication;
  updated_by: CommsAccount | null;
  created_at: string;
  updated_at: string;
  num_recipients: number;
  num_messages: number;
  data: {};
};

export type CommsThreadRecipient = {
  id: number;
  created_at: string;
  updated_at: string;
  thread: string;
  account: CommsAccount;
};

export type CASHousekeepingTemplate = {
  id: string;
  status: string;
  visibility: string;
  category: string;
  priority: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  photo_required: boolean;
  video_required: boolean;
  notes_required: boolean;
  data: {};
  concerned_roles: {
    id: string;
    key: string;
    label: string;
  }[];
};

export type CASHousekeepingSchedule = {
  id: string;
  status: string;
  weekdays: string[];
  created_at: string;
  updated_at: string;
  timings: string[];
  special_instructions: "";
  template: CASHousekeepingTemplate;
  space: Space;
};

export type CASHousekeepingTasks = {
  id: string;
  category: string;
  priority: string;
  status: string;
  photos: [];
  videos: [];
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  special_instructions: string;
  scheduled_start: string;
  scheduled_finish: string;
  started_at: string;
  finished_at: string;
  cancelled_at: string;
  cancellation_reason: string;
  resolution: string;
  photo_required: boolean;
  video_required: boolean;
  notes_required: boolean;
  data: {};
  space: Space;
  requested_by: User;
  created_by: User;
  assigned_to: User;
  assigned_by: User;
  concerned_roles: [];
};

export type CASHousekeepingAttendance = {
  id: string | number;
  created_at: string;
  updated_at: string;
  checkin_time: string;
  checkout_time: string;
  data: {};
  user: User;
  estate: {
    id: string;
    name: string;
    code: string;
  };
};

export type EVMChain = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  ref_id: number;
  block_explorer_url: string;
};

export type EVMContract = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  chain: EVMChain;
  standard: "ero721" | "erc1155";
  address: string;
};

export type POA = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "upcoming" | "claimable" | "expired";
  category: "online" | "irl";
  title: string;
  description: string;
  url: string;
  started_at: string;
  ended_at: string;
  attendees_count: number;
  claim_start: string;
  claim_end: string;
  contract: EVMContract;
  token_ref_id: number;
  max_supply: number;
  num_holders: number;
  image: Media | null;
  video: Media | null;
  data: GeneralObject;
};

export type PoaHoldersResponse = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  wallet_address: string;
  transaction_hash: string;
  poa: string;
};

export type Breadcrumb = { label: string; href: string };

export type CASQuestions = {
  id: string;
  format: "text" | "number" | "select" | "multiselect";
  status: string;
  created_at: string;
  updated_at: string;
  data: {};
  text: string;
  choices: Array<{ label: string; value: string }>;
  required: boolean;
  options: {};
  sort_index: number;
  questionnaire: string;
};

export type CASQuestionnaire = {
  id: string;
  questions: CASQuestions[];
  created_at: string;
  updated_at: string;
  data: {};
  title: string;
  description: string;
  slug: string;
};

export type QuestionnaireAnswer = {
  id: string;
  media: any[];
  created_at: string;
  updated_at: string;
  data: any;
  content: string;
  choices: string[];
  question: Question;
};

export type Booked_SKU = {
  id: number;
  status: string;
  customers: any[];
  offer: null;
  sku: Sku;
  created_at: string;
  updated_at: string;
  date: null;
  slot: null;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_details: {
    category: string;
    currency: string;
    state_tax: number;
    tax_amount: number;
    country_tax: number;
    state_tax_percent: number;
    country_tax_percent: number;
  };
  data: Record<string, any>;
  booking: string;
};

export type CASBookingResponse = {
  id: string;
  user: User;
  status: string;
  booked_skus: Booked_SKU[];
  offers: any[];
  total_amount: number;
  final_amount: number;
  due_amount: number;
  inventory_types: string[];
  payments: Payment[];
  questionnaire: Questionnaire;
  questionnaire_answers: QuestionnaireAnswer[];
  created_at: string;
  updated_at: string;
  pid: string;
  source: string;
  start_date: string | null;
  end_date: string | null;
  start_at: string;
  end_at: string;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_amount: number;
  advance_amount: number;
  paid_amount: number;
  data: any;
  customer_notes: string;
  guest_notes: string;
  internal_notes: string;
};

export type GalleryMedia = {
  id: string;
  url: string;
  metadata: {
    alt?: string;
    description?: string;
    title: string;
    priority?: number;
  };
};

export type CancellationPolicyResponse = {
  id: string;
  inventory: Inventory | null;
  operator: Operator | null;
  start_at?: string | null;
  end_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  min_days_before_checkin: number;
  max_days_before_checkin: number;
  min_hours_till_start?: number;
  max_hours_till_start?: number;
  refund_percent: number;
  created_at: string;
  updated_at: string;
};

export type CASMediaResponse = {
  id: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  metadata: {
    aspectRatio: number;
    alt: string;
    description: string;
    title: string;
  };
};

export type CommsApplication = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  key: string;
  deprecated_at: string;
  fcm_project_ref_id: string;
};

export type Lead = {
  id: string;
  title: string;
  value: string;
  origin: string;
  channel: string | null;
  add_time: string;
  cc_email: string;
  owner_id: number;
  was_seen: boolean;
  label_ids: string[];
  origin_id: string;
  person_id: number;
  channel_id: string | null;
  creator_id: number;
  visible_to: string;
  is_archived: boolean;
  source_name: string;
  update_time: string;
  organization_id: string | null;
  next_activity_id: string | null;
  expected_close_date: string | null;
};

export type IM = {
  value: string;
  primary: boolean;
};

export type Email = {
  label: string;
  value: string;
  primary: boolean;
};

export type Phone = {
  label: string;
  value: string;
  primary: boolean;
};

export type Owner = {
  id: number;
  name: string;
  email: string;
  value: number;
  has_pic: boolean;
  pic_hash: string | null;
  active_flag: boolean;
};

export type Person = {
  id: number;
  im: IM[];
  name: string;
  email: Email[];
  label: string | null;
  notes: string | null;
  phone: Phone[];
  org_id: string | null;
  add_time: string;
  birthday: string | null;
  cc_email: string;
  org_name: string | null;
  owner_id: Owner;
  job_title: string | null;
  label_ids: string[];
  last_name: string;
  company_id: number;
  first_char: string;
  first_name: string;
  owner_name: string;
  picture_id: string | null;
  visible_to: string;
  active_flag: boolean;
  delete_time: string | null;
  files_count: number;
  notes_count: number;
  update_time: string;
  primary_email: string;
  postal_address: string | null;
  followers_count: number;
  won_deals_count: number;
  activities_count: number;
  last_activity_id: string | null;
  lost_deals_count: number;
  next_activity_id: string | null;
  open_deals_count: number;
  closed_deals_count: number;
  last_activity_date: string | null;
  next_activity_date: string | null;
  next_activity_time: string | null;
  postal_address_lat: string | null;
  postal_address_long: string | null;
  email_messages_count: number;
  postal_address_route: string | null;
  done_activities_count: number;
  postal_address_country: string | null;
  last_incoming_mail_time: string | null;
  last_outgoing_mail_time: string | null;
  postal_address_locality: string | null;
  related_won_deals_count: number;
  undone_activities_count: number;
  related_lost_deals_count: number;
  related_open_deals_count: number;
  postal_address_subpremise: string | null;
  postal_address_postal_code: string | null;
  postal_address_sublocality: string | null;
};

export type Data = {
  lead: Lead;
  person: Person;
  deal: Deal;
  wati_ref_message: WatiRefMessage;
};

export type CasLeadResponse = {
  id: string;
  status: string;
  category: string;
  stage: string;
  created_at: string;
  updated_at: string;
  pid: string;
  data: Data;
  ref_id: string;
  mobile_country_code: string;
  mobile_number: string;
  email_address: string;
  user: string | null;
  assigned_to: string | null;
};
export type LastActivity = {
  id: number;
  done: boolean;
  lead: null;
  note: null;
  type: string;
  org_id: null;
  series: null;
  deal_id: number;
  lead_id: null;
  private: boolean;
  subject: string;
  user_id: number;
  add_time: string;
  due_date: string;
  due_time: string;
  duration: string;
  location: null;
  org_name: null;
  priority: null;
  rec_rule: null;
  attendees: null;
  busy_flag: boolean;
  person_id: number;
  type_name: string;
  company_id: number;
  deal_title: string;
  lead_title: null;
  owner_name: string;
  project_id: null;
  active_flag: boolean;
  person_name: string;
  update_time: string;
  is_recurring: null;
  location_lat: null;
  participants: {
    person_id: number;
    primary_flag: boolean;
  }[];
  reference_id: null;
  location_long: null;
  project_title: null;
  location_route: null;
  reference_type: null;
  update_user_id: number;
  source_timezone: null;
  deal_dropbox_bcc: string;
  location_country: null;
  location_locality: null;
  created_by_user_id: number;
  person_dropbox_bcc: string;
  public_description: string;
  rec_rule_extension: null;
  assigned_to_user_id: number;
  location_subpremise: null;
  marked_as_done_time: string;
};

export type Deal = {
  id: number;
  acv: number | null;
  arr: number | null;
  mrr: number | null;
  label: string | null;
  title: string;
  value: number;
  active: boolean;
  org_id: number | null;
  origin: string;
  status: string;
  channel: string | null;
  deleted: boolean;
  user_id: number;
  add_time: string;
  cc_email: string;
  currency: string;
  org_name: string | null;
  stage_id: number;
  won_time: string | null;
  lost_time: string | null;
  origin_id: string;
  person_id: number;
  channel_id: string | null;
  close_time: string | null;
  org_hidden: boolean;
  owner_name: string;
  visible_to: string;
  files_count: number;
  lost_reason: string | null;
  notes_count: number;
  person_name: string;
  pipeline_id: number;
  probability: number | null;
  rotten_time: string | null;
  update_time: string;
  acv_currency: string | null;
  arr_currency: string | null;
  mrr_currency: string | null;
  person_hidden: boolean;
  first_won_time: string | null;
  local_won_date: string | null;
  products_count: number;
  stage_order_nr: number;
  weighted_value: number;
  creator_user_id: number;
  followers_count: number;
  formatted_value: string;
  local_lost_date: string;
  activities_count: number;
  last_activity_id: number;
  local_close_date: string;
  next_activity_id: number | null;
  stage_change_time: string;
  last_activity_date: string;
  next_activity_date: string | null;
  next_activity_note: string | null;
  next_activity_time: string | null;
  next_activity_type: string | null;
  participants_count: number;
  expected_close_date: string | null;
  email_messages_count: number;
  done_activities_count: number;
  next_activity_subject: string | null;
  next_activity_duration: string | null;
  last_incoming_mail_time: string | null;
  last_outgoing_mail_time: string | null;
  undone_activities_count: number;
  weighted_value_currency: string;
  formatted_weighted_value: string;
  last_activity: LastActivity;
};
export type WatiRefMessage = {
  model: {
    ids: string[];
  };
  result: boolean;
  contact: {
    id: string;
    wAid: string;
    phone: string;
    photo: string | null;
    source: string | null;
    created: string;
    optedIn: boolean;
    teamIds: string[];
    allowSMS: boolean;
    fullName: string;
    isInFlow: boolean;
    tenantId: string;
    firstName: string;
    isDeleted: boolean;
    lastFlowId: string;
    lastUpdated: string;
    customParams: Array<{
      name: string;
      value: string;
    }>;
    contactStatus: string;
    allowBroadcast: boolean;
    currentFlowNodeId: string;
    selectedHubspotId: string;
  };
  parameteres: unknown[];
  phone_number: string;
  template_name: string;
  validWhatsAppNumber: boolean;
};

export type History = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string;
  lead: string;
  stage: string;
  assigned_to: string | null;
  data: {
    deal: Deal;
    lead: Lead;
    person: Person;
  };
};

export type Meeting = {
  id: string;
  status: string;
  medium: string;
  created_at: string;
  updated_at: string;
  data: {
    uri: string;
    name: string;
    email: string;
    event: string;
    status: string;
    no_show: unknown | null;
    payment: unknown | null;
    timezone: string;
    last_name: string | null;
    cancel_url: string;
    created_at: string;
    first_name: string | null;
    updated_at: string;
    new_invitee: unknown | null;
    old_invitee: unknown | null;
    rescheduled: boolean;
    reconfirmation: unknown | null;
    reschedule_url: string;
    scheduled_event: {
      uri: string;
      name: string;
      status: string;
      end_time: string;
      location: {
        type: string;
        location: string;
      };
      created_at: string;
      event_type: string;
      start_time: string;
      updated_at: string;
      event_guests: unknown[];
      invitees_counter: {
        limit: number;
        total: number;
        active: number;
      };
      event_memberships: {
        user: string;
        user_name: string;
        user_email: string;
      }[];
      meeting_notes_html: string | null;
      meeting_notes_plain: string | null;
    };
    scheduling_method: unknown | null;
    invitee_scheduled_by: unknown | null;
    text_reminder_number: unknown | null;
    questions_and_answers: unknown[];
    routing_form_submission: unknown | null;
  };
  contact_information: {
    name: string;
    email_address: string;
    mobile_number: string;
    mobile_country_code: string;
  };
  location: {
    type: string;
    phone: string;
  };
  scheduled_start: string;
  scheduled_finish: string;
  cancelled_at: string | null;
  cancellation_reason: string;
  lead: {
    id: string;
    status: string;
    category: string;
    stage: string;
    created_at: string;
    updated_at: string;
    pid: string;
    ref_id: string;
    mobile_country_code: string;
    mobile_number: string;
    email_address: string;
    user: unknown | null;
    assigned_to: unknown | null;
  };
};

export type Application = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  deprecated: boolean;
  data: unknown;
  comms_ref_id: string | null;
  fcm_project_ref_id: string;
};

export type Offer = {
  id: number | string;
  status: string;
  discount_type: string;
  contract_type: string;
  created_at: string;
  updated_at: string;
  pid: string;
  name: string;
  discount_value: number;
  max_discount_value: number;
  min_booked_units: number;
  max_booked_units: number;
  min_booked_date?: string;
  max_booked_date?: string;
  applicable_before?: string;
  applicable_after?: string;
  applicable_on_weekdays: Array<number>;
  max_booked_on_delta: string | number;
  contract_address: string;
  min_nfts_owned: number;
  applicable_inventories: Array<Inventory>;
  currency: Currency;
};

export type Coupon = {
  id: number;
  status: string;
  discount_type: string;
  created_at: string;
  updated_at: string;
  pid: string;
  data: GeneralObject;
  name: string;
  code: string;
  discount_value: number;
  max_discount_value: number;
  applicable_before: string;
  applicable_after: string;
  applicable_on_weekdays: number[];
  min_booking_amount: number;
  max_booking_amount: number;
  min_booked_units: number;
  max_booked_units: number;
  min_booking_start_at: string;
  max_booking_end_at: string;
  max_booked_on_delta: string | number;
  max_usage_count: number;
  currency: Currency;
  applicable_inventories: Inventory[];
};

export type Template = {
  id: string;
  category: string;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  content: GeneralObject | string;
  destination: {
    channel: number | string;
    bot_name: string;
  };
};

export type Policy = {
  id: number;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: GeneralObject;
  title?: string;
  description: string;
  icon?: string;
};

export type Coordinates = {
  type: string;
  coordinated: [number, number];
};

export type Node = {
  id: string;
  coordinates: Coordinates;
  created_at: string;
  updated_at: string;
  data: GeneralObject;
  name: string;
  address: string;
  description: string;
  destination: CASDestinationResponse;
};

export type Host = {
  id: string;
  pid: string;
  nickname: string;
  full_name: string;
  gender: string | null;
  relationship_status: string | null;
  date_of_birth: string | null;
  bio: string;
  pfp_image: string;
  socials: any[];
  cultures: any[];
  avatar: Record<string, any>;
  country: string | null;
};

export type Locking = {
  id: number;
  reason: string;
  created_at: string;
  updated_at: string;
  date: string | null;
  slot: string | null;
  note: string;
  units: number;
  sku: string;
  booking: string | null;
};
export type DiscoverCard = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  media: string;
  link_text: string;
  link_url: string;
};

export type ShowcaseDisplay = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  data: GeneralObject;
  space: CASSpaceByFloorResponse;
};

export type ShowcaseSession = {
  id: string;
  status: string;
  showcase_type: string;
  created_at: string;
  updated_at: string;
  token: string;
  data: {
    filter_ids: string[];
    refresh_rate: number;
    max_art_per_screen: number;
    display_orientation: string;
  };
  display: ShowcaseDisplay;
};

export interface TripItineraryItem {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: {
    day?: string;
    sub_title?: string;
  };
  title: string;
  description: string;
  icon: string;
  media: Media[];
}

export interface TripPolicy {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface TripFAQ {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface TripInclusion {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface Trip {
  id: string;
  category: string;
  type: string;
  status: string;
  tax_category: string;
  media: Media[];
  inclusions: TripInclusion[];
  exclusions: TripInclusion[];
  itinerary: TripItineraryItem[];
  essentials: any[];
  highlights: any[];
  skus: {
    id: string;
    pid: string;
    name: string;
    inventory: {
      id: string;
      pid: string;
      name: string;
      category: string;
      type: string;
      occupancy: number | null;
      status: string;
      start_at: string | null;
      end_at: string | null;
      media: Media[];
    };
  }[];
  policies: TripPolicy[];
  hosts: any[];
  tags: any[];
  destinations: any[];
  faqs: TripFAQ[];
  created_at: string;
  updated_at: string;
  pid: string;
  sort_index: number;
  name: string;
  description: string;
  data: Record<string, any>;
  subcategory: string;
  occupancy: number | null;
  applicable_taxes: any[];
  short_description: string | null;
  start_at: string | null;
  end_at: string | null;
  slots: number | null;
  booking_constraints: Record<string, any>;
  operator: string;
  vendor: string | null;
  questionnaire: string | null;
  node: string | null;
}

interface Vendor {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  tax_details: Record<string, any>;
}
export interface Addon {
  id: string;
  tax_category: string;
  status: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: {
    vendor_price: number;
  };
  name: string;
  description: string;
  applicable_taxes: string[];
  vendor: Vendor;
  inventory: Inventory;
}

export interface Payment {
  id: string;
  email: string;
  mobile: string;
  first_name: string;
  last_name: string;
  client_reference_id: string;
  order_description: string;
  status: string;
  payment_mode: string;
  product_id: string;
  amount: number;
  hash: string;
  created_at: string;
  updated_at: string;
  merchant: string;
  intent: number;
  success_at: string;
  reason: string;
  merchant_response: {
    order_status: string;
  };
  refunded: boolean;
  refunded_amount: number;
  refund_completed: boolean;
  booking: string;
  currency: string;
  related_to: string | null;
}

export interface TripGuest {
  id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  mobile: string;
  date_of_birth: Date;
  country: string;
  address: string;
  gender: string;
  user?: GeneralObject;
  pid?: string;
}

export interface SpotlightTrip {
  pid: string;
  name: string;
  banner: string;
  batches?: string[];
  starting_price?: number;
  itinerary?: Array<{
    day: number;
    title: string;
    image: string;
  }>;
  currency?: {
    name: string;
    code: string;
    decimals: number;
    symbol: string;
  };
}

export interface TripCustomer {
  id: string;
  gender: "Male" | "Female" | "Other" | string;
  created_at: string;
  updated_at: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  mobile: string;
  address?: string;
  kyc: Record<string, any>;
  data: Record<string, any>;
  booking: string;
  nationality: {
    id: string;
    name: string;
    code: string;
  };
  user: {
    id: string;
    pid: string;
    first_name: string;
    last_name: string;
    email_address: string;
    wallet_address: string;
    mobile_number: string;
    nickname: string | null;
    membership: "none" | "basic" | "premium" | string;
    pfp_image: string;
    twitter_handle: string;
    cultures: string[];
    avatar: {
      ref_id: string;
      image: string;
      metadata: string;
    };
  };
  fullName: string;
  status: "confirmed" | "pending" | "cancelled" | string;
  age: number;
}

export interface TripBooking {
  id: string;
  user: User;
  reserved_by: User;
  status: string;
  booked_skus: BookedSku[];
  offers: any[];
  total_amount: number;
  final_amount: number;
  due_amount: number;
  inventory_types: string[];
  payments: Payment[];
  kyc_documents: {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    slug: string;
  }[];
  created_at: string;
  updated_at: string;
  pid: string;
  source: string;
  start_at: string;
  end_at: string;
  started_at: string | null;
  ended_at: string | null;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_amount: number;
  advance_amount: number;
  paid_amount: number;
  refund_amount: number;
  data: Record<string, any>;
  customer_notes: string;
  guest_notes: string;
  internal_notes: string;
  cancelled_at: string | null;
  cancellation_reason: string;
  refund_in_credits: boolean;
  modified_at: string | null;
  last_synced_at: string | null;
  tracking_metadata: Record<string, any>;
  client: string;
  coupon: any | null;
  currency: string;
  operator: string;
  customers: any[];
  upgrades: any[];
}

export interface FeaturedTag {
  id: number;
  created_at: string;
  updated_at: string;
  sort_index: number;
  category: string;
  tag: {
    id: number;
    created_at: string;
    updated_at: string;
    slug: string;
    label: string;
    emoji: string;
  };
}

export interface Operator {
  id: string;
  status: string;
  media: Media[];
  created_at: string;
  updated_at: string;
  pid: string;
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  data: Record<string, any>;
  policy: any | null;
  cancellation_policy: any | null;
  internally_managed: boolean;
  channel_ref_id: string;
  min_duration: number;
  max_duration: number;
  breakfast_included: boolean;
  off_days: number[];
  alt_name: string;
  coordinates: string;
  destination: Destination;
  currency: Currency;
  estate: any | null;
  channel: string;
  questionnaire: any | null;
  staff: any[];
}

export interface Channel {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  pid: string;
  code: string;
  data: Record<string, any>;
}

export interface OperatorFAQ {
  id: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
}

export interface PartnerCommission {
  id: string;
  status: string;
  commission_type: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  data: Record<string, any>;
  title: string;
  description: string;
  icon: string;
  operator: string;
  data: Record<string, any>;
  title: string;
  percent_amount: string;
  amount: number;
  applicable_from: string | null;
  applicable_till: string | null;
  currency: Currency;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface VendorService {
  id: string;
  name: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface VendorServiceDestination {
  id: string;
  vendor: Vendor;
  service: VendorService;
  destination: Destination;
  created_at: string;
  updated_at: string;
}
