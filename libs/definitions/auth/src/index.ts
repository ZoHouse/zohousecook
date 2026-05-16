/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { Query, QueryFunctionContext, QueryKey } from "react-query";

export type AuthUser = {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  wallet_address: string;
  mobile_number: string;
  email_address: string;
  access_groups: string[];
  roles?: string[];
  membership: string;
};

export type Profile = {
  address: string;
  assets: GeneralObject[];
  avatar_url: string;
  background_key: string;
  bio: string;
  city: number;
  code: string;
  country_citizen: number;
  country_residing: number;
  date_joined: string;
  date_of_birth: string;
  description: string;
  email: string;
  email_verified: boolean;
  experience: number;
  first_name: string;
  gender: number;
  hometown: number;
  last_name: string;
  level: number;
  level_percent: number;
  lobby_name: string;
  media: GeneralObject;
  middle_name: string;
  mobile: string;
  mobile_country_code: string;
  mobile_verified: boolean;
  music_key: string;
  nickname: string;
  relationship_status: number;
  security: number;
  socials: GeneralObject[];
  speakability: number;
  status: string;
  subdomain: string;
  tags: GeneralObject[];
  time_create: string;
  time_update: string;
  work_role: string;
  // Onboarding fields (returned by backend, previously untyped)
  custom_nickname?: string;
  ens_nickname?: string;
  selected_nickname?: string;
  body_type?: "bro" | "bae";
  avatar?: {
    image: string;
    metadata: string;
    ref_id: number;
  };
  pfp_image?: string;
  pfp_metadata?: {
    contract_address?: string;
    token_id?: string;
    metadata?: string;
    is_valid?: string;
  };
  where_do_you_live?: string;
  where_do_you_live_ref_id?: string;
  where_do_you_live_location?: { lat: number; lng: number } | null;
  place_name?: string;
  place_ref_id?: string;
  home_location?: { lat: number; lng: number } | null;
  country?: {
    code: string;
    name: string;
    local_currency?: string;
    flag?: string;
    mobile_code?: string;
  };
  cultures?: Array<{
    key: string;
    name: string;
    description?: string;
    icon?: string;
  }>;
};

export type QueryConfig = {
  enabled?: boolean;
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
  retryOnMount?: boolean;
  retryDelay?: number | ((retryAttempt: number, error: any) => number);
  staleTime?: number;
  cacheTime?: number;
  queryKeyHashFn?: (queryKey: QueryKey) => string;
  refetchInterval?:
    | number
    | false
    | ((data: any | undefined, query: Query) => number | false);
  refetchIntervalInBackground?: boolean;
  refetchOnMount?: boolean | "always" | ((query: Query) => boolean | "always");
  refetchOnWindowFocus?:
    | boolean
    | "always"
    | ((query: Query) => boolean | "always");
  refetchOnReconnect?:
    | boolean
    | "always"
    | ((query: Query) => boolean | "always");
  notifyOnChangeProps?: string[] | "tracked";
  notifyOnChangePropsExclusions?: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onSettled?: (data?: any, error?: any) => void;
  select?: (data: any) => unknown;
  suspense?: boolean;
  initialData?: any | (() => any);
  initialDataUpdatedAt?: number | (() => number | undefined);
  placeholderData?: any | (() => any);
  keepPreviousData?: boolean;
  structuralSharing?: boolean;
  useErrorBoundary?:
    | undefined
    | boolean
    | ((error: any, query: Query) => boolean);
  meta?: Record<string, unknown>;
};

export type QueryArgs = {
  queryKey: string[];
  queryFn: (context: QueryFunctionContext) => Promise<any>;
};

export type QueryObjectFunction = (
  additionalRoute: string,
  search: string,
  config?: QueryConfig
) => QueryArgs;

export type MutationArgs = { data: GeneralObject; route?: string };

export interface PFP_Metadata {
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
  nickname: string | null;
  membership: string;
  pfp_image: string;
  pfp?: string;
  data?: GeneralObject;
  twitter_handle: string;
  pfp_metadata?: PFP_Metadata;
  mobile_number: string;
  name?: string;
}

export type LoginTypes = "email" | "wallet" | "mobile";
