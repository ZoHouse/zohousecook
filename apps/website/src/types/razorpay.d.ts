declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

interface RazorpayCheckoutInstrument {
  method: "card" | "upi" | "emandate" | "netbanking" | "nach" | "wallet" | string;
  banks?: string[];
  flows?: string[];
  issuers?: string[];
}

interface RazorpayCheckoutBlock {
  name: string;
  instruments: RazorpayCheckoutInstrument[];
}

interface RazorpayCheckoutDisplayConfig {
  blocks?: Record<string, RazorpayCheckoutBlock>;
  sequence?: string[];
  preferences?: {
    show_default_blocks?: boolean;
  };
}

interface RazorpayCheckoutOptions {
  key: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  subscription_id?: string;
  // 1 = recurring/mandate flow. Required for subscriptions to surface
  // mandate-capable methods (UPI AutoPay, eMandate, eNach).
  recurring?: 0 | 1;
  name?: string;
  description?: string;
  image?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  config?: {
    display?: RazorpayCheckoutDisplayConfig;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

export {};
