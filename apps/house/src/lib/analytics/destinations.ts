import posthog from "posthog-js";
import { setDestinations } from "./track";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    Moengage?: {
      track_event: (event: string, props: Record<string, unknown>) => void;
      add_unique_user_id: (id: string) => void;
      add_mobile: (mobile: string) => void;
      add_email: (email: string) => void;
      add_first_name: (name: string) => void;
      add_user_attribute: (key: string, value: unknown) => void;
      destroy_session: () => void;
    };
  }
}

const META_STANDARD_EVENT: Record<string, string | undefined> = {
  page_view: "PageView",
  cta_click: undefined, // gated on intent below
  otp_verified: "Lead",
  apply_submit_success: "CompleteRegistration",
  vs_ns_section_view: "ViewContent",
};

export function initDestinations(opts: {
  posthogKey?: string;
  posthogHost?: string;
}): void {
  // PostHog only inits if a key is provided. Other destinations check their own
  // globals at call time (window.gtag, window.fbq, window.Moengage), so missing
  // env vars for one tool never silently disable others.
  if (opts.posthogKey) {
    posthog.init(opts.posthogKey, {
      api_host: opts.posthogHost || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false, // we fire page_view ourselves
      session_recording: { maskAllInputs: true },
    });
  }

  setDestinations({
    ga4: (event, props) => {
      window.gtag?.("event", event, props);
    },
    posthog: (event, props) => {
      // posthog.capture is safe even if init() never ran — it queues internally.
      posthog.capture?.(event, props);
    },
    moengage: (event, props) => {
      window.Moengage?.track_event(event, props);
    },
    metaPixel: (event, props) => {
      const meta = META_STANDARD_EVENT[event];
      if (event === "cta_click" && (props as { intent?: string }).intent === "apply") {
        window.fbq?.("track", "InitiateCheckout", props);
      } else if (meta) {
        window.fbq?.("track", meta, props);
      }
      // Internal event names also fire as custom events for full visibility.
      window.fbq?.("trackCustom", event, props);
    },
  });
}
