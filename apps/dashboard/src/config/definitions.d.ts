export type AuthEmail = {
  verification_type: string;
  created_at: string;
  updated_at: string;
  primary: boolean,
  verified: boolean,
  email_address: string;
  dnd: boolean;
};

export type AuthMobile = {
  created_at?: string;
  updated_at?: string;
  primary: boolean;
  verified: boolean;
  mobile_country_code: string;
  mobile_number: string;
  has_whatsapp: boolean;
  dnd: boolean;
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
