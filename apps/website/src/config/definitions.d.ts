import { GeneralObject } from "@zo/definitions/general";

export type Destination = {
  id: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
};

export type Currency = {
  id: string;
  code: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  decimals: number;
  symbol: string;
};
export interface Media {
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
export interface Sku {
  id: string;
  features: unknown[];
  inclusions: unknown[];
  exclusions: unknown[];
  faqs: unknown[];
  eligibility_criteria: number[];
  media: unknown[];
  created_at: string;
  updated_at: string;
  pid: string;
  name: string;
  data: Record<string, unknown>;
  price: number;
  slabs: unknown[];
  units: number;
  sellable: boolean;
  inventory: Inventory;
  space: Space;
}

export type BookingExperienceResponse = {
  operator: {
    pid: string;
    name: string;
    destination: {
      name: string;
      code: string;
      country: string;
      timezone: string;
    };
  };
  vendor: null;
  distance: number;
  icon?: string;
  type: string;
  category: string;
  status: string;
  features: unknown[];
  inclusions: unknown[];
  exclusions: unknown[];
  faqs: unknown[];
  pid: string;
  sort_index: number;
  name: string;
  description: string;
  occupancy: null;
  tax_category: number;
  cover_image: string;
  applicable_taxes: string[];
  start_at: string;
  end_at: string;
  link?: string;
  media: Media[];
  price: number;
  skus: Sku[];
  questionnaire?: string;

  latitude: number;
  location: string;
  longitude: number;
  navigation_link: string;
  registration_link: string;
  subcategory?: string;
  short_description?: string;
  luma_ref_id: string;
  icon: string;

  tags: string[];
};

export type ZoActivitySku = {
  pid: string;
  name: string;
  specifications: Record<string, unknown>;
  price: number;
  slabs: unknown[];
  units: number;
  has_infinite_units: boolean;
  sellable: boolean;
  date: string;
  start_time: string;
  end_time: string | null;
  inventory: string;
  currency: Currency;
};

export type ZoActivity = {
  operator: string;
  type: string;
  category: string;
  status: string;
  skus: ZoActivitySku[];
  media: Media[];
  pid: string;
  sort_index: number;
  name: string;
  description: string;
  data: Record<string, unknown>;
  subcategory: string;
  occupancy?: number;
  tax_category: number;
};

export type UnifiedEventItem = {
  id: string;
  type: 'event' | 'activity';
  name: string;
  date: string;
  startTime?: string;
  endTime?: string | null;
  category: string;
  subcategory?: string;
  price: number;
  latitude: number;
  longitude: number;
  location: string;
  distance?: number | string;
  icon?: string;
  coverImage?: string;
  registrationLink?: string;
  navigationLink?: string;
  operatorName?: string;
  originalEvent?: BookingExperienceResponse;
};

export type Pricing = {
  pid: string;
  strike_price: number;
  strike_price_taxed: number;
  price: number;
  price_taxed: number;
  labels: [];
  currency: Currency;
};

export type Availability = {
  pid: string;
  units: number;
  sellable: boolean;
};

export type Question = {
  id: string;
  questionnaire: string;
  status: string;
  format: "text" | "number" | "select" | "multiselect";
  text: string;
  choices: [];
  required: boolean;
  options: unknown;
  sort_index: number;
  data: GeneralObject;
};

export type Questionnaire = {
  id: string;
  title: string;
  description: string;
  slug: string;
  data: GeneralObject;
  questions: Question[];
};

export type Answer = {
  id: string;
  question: {
    id: string;
    questionnaire: string;
    status: string;
    format: string;
    text: string;
    choices: [];
    required: true;
    options: GeneralObject;
    sort_index: 0;
    data: GeneralObject;
  };
  content: string;
  choices: [];
  media: [];
  data: GeneralObject;
};

export type BookingsQuestionnaireResponse = {
  num_questions: 3;
  questionnaire: Questionnaire;
  completed: boolean;
  answers: Answer[];
};

export type AnswerQuestionResponse = {
  id: string;
  question: Question;
  content: string;
  choices: string[];
  media: [];
  data: GeneralObject;
};

export type Tweets = {
  id: string;
  created_at: string;
  title: string;
  content: {
    tweet: {
      id: string;
      geo: {
        place_id: string;
      };
      lang: string;
      text: string;
      entities: {
        urls: {
          end: number;
          url: string;
          start: number;
          media_key?: string;
          display_url: string;
          expanded_url: string;
        }[];
        annotations: {
          end: number;
          type: string;
          start: number;
          probability: number;
          normalized_text: string;
        }[];
      };
      includes: {
        media: {
          url: string;
          type: string;
          width: number;
          height: number;
          media_key: string;
        }[];
        users: {
          id: string;
          url: string;
          name: string;
          username: string;
          verified: boolean;
          profile_image_url: string;
        }[];
        places: {
          id: string;
          geo: {
            bbox: [number, number, number, number];
            type: string;
            properties: Record<string, unknown>;
          };
          name: string;
          country: string;
          full_name: string;
          place_type: string;
          country_code: string;
        }[];
      };
      author_id: string;
      created_at: string;
    };
  };
  data: {
    tweet_url: string;
  };
  media: unknown[];
  tweet_context: {
    url: string;
    author_ref_user: unknown;
  };
};

export type Contract = {
  chain: {
    name: string;
    ref_id: number;
    block_explorer_url: string;
  };
  standard: string;
  address: string;
};

export type DropFunction = {
  name: string;
  type: string;
  inputs: {
    name: string;
    type: string;
    internalType: string;
  }[];
  outputs: {
    name: string;
    type: string;
    internalType: string;
  }[];
  stateMutability: string;
};

export type AirdropDetails = {
  name: string;
  slug: string;
  contract: Contract;
  total_supply: number;
  supply_left: number;
  drop_function: DropFunction;
  requires_founder_token: boolean;
  status: string;
  scheduled_start: Date | null;
  scheduled_end: Date | null;
};

export type Collection = {
  name: string;
  slug: string;
  total_supply: number;
  supply_left: number;
  status: string;
};

export type Airdrop = {
  id: string;
  wallet_address: string;
  collection: string;
  status: string;
  founder_token_ref_id: string;
  transaction_hash: string;
};

export type AirdropStatus = {
  collection: Collection;
  airdrops: Airdrop[];
  founders_tokens_available_for_claim: string[];
};

export type Poa = {
  title: string;
  description: string;
  status: string;
  category: string;
  url: string;
  started_at: string;
  ended_at: string;
  claim_start: string | null;
  claim_end: string | null;
  data: GeneralObject;
};

export type PoaDropStatus = {
  poa: Poa;
  wallet_address: string;
  status: string;
  transaction_hash: string;
};

export type PoaMetadata = {
  animation_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  description: string;
  ended_at: string;
  external_url: string;
  id: number;
  image: string;
  name: string;
  started_at: string;
};

export type PublicPoaData = {
  title: string;
  description: string;
  status: string;
  category: string;
  url: string;
  started_at: string;
  ended_at: string;
  claim_start: string | null;
  claim_end: string | null;
  data: Record<string, unknown>;
  image: string;
  video: string;
};

export type Metadata = {
  id: string;
  created_at: string;
  updated_at: string;
  url: string;
  data: GeneralObject;
  title: string;
  description: string;
  image: string;
};

export interface ZoWorldDestinationResponse {
  name: string;
  twitter_handle: string;
  id: string;
  email: string;
  code: string;
  local_currency: string;
  media: Media[];
  coordinates: Coordinate;
  timezone: string;
  country: {
    name: string;
    id: string;
    code: string;
    local_currency: string;
  };
}

export interface Feature {
  name: string;
  description: string;
  icon: string;
}

export interface GuestPolicy {
  title: string;
  description: string;
  icon: string;
  sort_index: number;
}

export interface Estate {
  name: string;
  code: string;
  location: {
    type: string;
    coordinates: number[];
  };
}

export interface BookingOperatorResponse {
  destination: {
    name: string;
    code: string;
    country: string;
    timezone: string;
  };
  features: Feature[];
  inclusions: unknown[];
  exclusions: unknown[];
  faqs: unknown[];
  vendors: unknown[];
  media: Media[];
  estate: Estate;
  guest_policies: GuestPolicy[];
  pid: string;
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  policy: string | null;
  cancellation_policy: string | null;
  internally_managed: boolean;
  alt_name: string;
  currency: string;
  questionnaire: string | null;
  cancellation_policies: unknown[];
}
