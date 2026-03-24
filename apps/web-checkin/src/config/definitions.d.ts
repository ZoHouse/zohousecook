export interface Image {
  id: string;
  title: string;
  description: string | null;
  image: string;
  alt_text: string;
  priority: number;
}
export interface Video {
  id: string;
  title: string;
  description: string | null;
  video: string;
  alt_text: string;
  priority: number;
}

export interface Destination {
  code: string;
  slug: string;
  name: string;
  alt_name: string;
  thumbnail: string;
  short_description: string;
}

export interface Operator {
  name: string;
  code: string;
  slug: string;
  type_code: string;
  tagline: string | null;
  description: string;
  short_description: string;
  title: string;
  images: Image[];
  destination: Destination;
  policy: string;
  cancellation_policy: string;
  covid_policy: string;
  directions: string;
  checkin_time: string;
  checkout_time: string;
  address: string;
  phone: string;
  email: string;
  case_study: string | null;
  checkin_enabled: boolean;
  latitude: number;
  longitude: number;
  room: number;
}

export interface TaxBreakup {
  cgst: number;
  sgst: number;
}

export interface Asset {
  id: number;
  name: string;
  parent_name: string | null;
  description: string | null;
  data: Record<string, never>;
  time_create: string;
  time_update: string;
  inventory: number;
}

export interface Room {
  id: number;
  dates: string[];
  units: number;
  price: number;
  occupancy: number;
  tax_breakup: TaxBreakup;
  discount: number;
  total_amount: number;
  addons: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  offer_discount: number;
  final_amount: number;
  asset: Asset;
  name: string;
  image: string;
}

export interface Guest {
  name: string;
  email: string;
  gender: string;
  mobile: string;
  address: string;
  last_name: string;
  first_name: string;
}

export interface RoomInfo {
  guest: Guest;
  price: number;
  nights: number;
  ref_id: string;
  status: number;
  checkin: string;
  checkout: string;
  discount: number;
  asset_name: string;
  paid_amount: number;
  tax_breakup: TaxBreakup;
  total_amount: number;
  extra_charges: number;
  unit_sequence: number;
  advance_amount: number;
  inventory_name: string;
  transaction_id: string;
  paid_extra_charges: number;
}

export interface Source {
  id: number;
  checkin_enabled: boolean;
  name: string;
  ota_commission_percent: number;
  zostel_commission_percent: number;
  category: number;
  display_name: string | null;
  logo: string | null;
  default: boolean;
  operator: number;
  pricing: string | null;
}

export interface Booking {
  code: string;
  operator: Operator;
  channel_booking: string | null;
  checkin: string;
  tax_amount: number;
  checkout: string;
  reserved_by: Record<string, never>;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  can_pay_later: boolean;
  gst_num: string | null;
  status: string;
  time_create: string;
  time_update: string;
  rooms: Room[];
  discount: number;
  coupon_code: string;
  manager_notes: string | null;
  guest_notes: string | null;
  auto_cancel_at: string | null;
  offer_discount: number;
  final_amount: number;
  amount: number;
  rooms_info: RoomInfo[];
  origin: number;
  source: Source;
  web_checkin_completed: boolean;
  checkins: Array<{
    id: number;
    guest: Guest;
    room: Room;
    checkin_time: string;
    checkout_time: string;
  }>;
  total_guests: number;
  total_addon_amount: number;
  total_amount_with_addons: number;
  guests: Array<{
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    gender: string;
    address: string;
    country: number;
    sso_user_id: string | null;
  }>;
}

export interface Country {
  name: string;
  code: string;
  local_currency: string;
  flag: string;
  mobile_code: string;
}

export interface ZostelStayOperatorResponse {
  rooms: Array<{
    id: number;
    addons: Array<{
      id: number;
      name: string;
      description: string;
      price: number;
      max_purchase: number;
      tax_breakup: {
        category: string;
        cgst: number;
        cgst_percent: number;
        sgst: number;
        sgst_percent: number;
      };
      sell_datewise: boolean;
    }>;
    status: string;
    category: string;
    sub_category: string;
    tax_category: string;
    amenities: Array<{
      id: number;
      name: string;
      code: string;
    }>;
    images: Image[];
    videos: Video[];
    code: string;
    name: string;
    description: string;
    inclusion: string | null;
    exclusion: string | null;
    itinerary: string | null;
    priority: number;
    units: number;
    price: number;
    advance_percent: number;
    occupancy: number;
    ref_keys: {
      ezee: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
    experience: string | null;
  }>;
  images: Image[];
  videos: Array<{
    id: string;
    title: string;
    description: string;
    video: string;
    alt_text: string;
    priority: number;
  }>;
  local_map: unknown[];
  amenities: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  destination: Destination & {
    region: Array<{
      name: string;
      type: number;
      slug: string;
    }>;
  };
  status: string;
  case_study: string | null;
  min_booking_date: string;
  checkin_enabled: boolean;
  type_code: string;
  operating_model: string;
  code: string;
  slug: string;
  name: string;
  alt_name: string;
  tagline: string | null;
  description: string;
  city: string;
  title: string;
  short_description: string;
  feature_priority: number;
  bookable_months: number;
  booking_delay: number;
  booking_min_length: number;
  bookable_occupancy: number;
  applicable_taxes: string[];
  ota_commission_payable: boolean;
  tax_exclusive_commission: boolean;
  latitude: number;
  longitude: number;
  geo_point: string;
  address: string;
  phone: string;
  email: string;
  directions: string;
  policy: string;
  cancellation_policy: string;
  covid_policy: string;
  checkin_time: string;
  checkout_time: string;
  webcheckin_link: string;
  data: {
    test: boolean;
    airport: {
      lat: number;
      lng: number;
    };
    thread_id: string;
    test_media: string;
    test_select: string[];
    mobile_number: string;
    checkin_enabled: boolean;
    min_booking_date: string;
  };
  kyc_documents: {
    id: number;
    name: string;
    slug: string;
    requires_back: boolean;
  }[];
}

export interface UserBooking {
  code: string;
  operator: {
    name: string;
    code: string;
    slug: string;
    tagline: string | null;
    title: string;
    checkin_enabled: boolean;
    cover_image: string;
  };
  checkin: string;
  tax_amount: number;
  checkout: string;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  status: string;
  time_create: string;
  discount: number;
  coupon_code: string;
  offer_discount: number;
  final_amount: number;
  amount: number;
  web_checkin_completed: boolean;
}

export type CheckinStep =
  | "welcome"
  | "login"
  | "basic-info"
  | "upload-ids"
  | "upload-ids-error"
  | "time-confirmation"
  | "checkin-success";
