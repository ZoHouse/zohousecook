import posthog from "posthog-js";
import {
  setIdentity,
  resetIdentity,
  detectPhoneSwitch,
} from "./identity";
import { hashE164Phone } from "./hash";
import { track } from "./track";

interface IdentifyArgs {
  phone_e164: string;
  email?: string;
  full_name?: string;
}

export async function identifyOnOtpVerified(
  args: IdentifyArgs
): Promise<{ phone_hash: string }> {
  const phone_hash = await hashE164Phone(args.phone_e164);

  // Per §7.2. different phone re-verify on same device.
  if (detectPhoneSwitch(phone_hash)) {
    posthog.reset?.();
    if (typeof window !== "undefined" && window.Moengage) {
      window.Moengage.destroy_session();
    }
    resetIdentity();
  }

  // PostHog identify.
  posthog.identify?.(phone_hash, {
    ...(args.email ? { email_provided: true } : {}),
  });

  // MoEngage identify.
  if (typeof window !== "undefined" && window.Moengage) {
    window.Moengage.add_unique_user_id(phone_hash);
    window.Moengage.add_mobile(args.phone_e164);
    if (args.email) window.Moengage.add_email(args.email);
    if (args.full_name) window.Moengage.add_first_name(args.full_name);
  }

  // GA4 user_id (read env directly so callers don't have to thread it).
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (typeof window !== "undefined" && window.gtag && ga4Id) {
    window.gtag("config", ga4Id, { user_id: phone_hash });
  }

  setIdentity({
    phone_hash,
    phone_e164: args.phone_e164,
    email: args.email,
    full_name: args.full_name,
  });

  return { phone_hash };
}

/**
 * Tag the PostHog person and MoEngage user with their Zo PID after the apply
 * form fetches the Zo profile. Uses `posthog.people.set(...)` (a property tag)
 * rather than `posthog.alias(...)` (which merges two distinct_ids).
 *
 * Per §7.2 collision rule: if the Zo profile's phone differs from the
 * OTP-verified phone, do NOT tag. fire identity_collision instead.
 */
export async function tagZoProfileIfMatching(
  member_id: string,
  expectedPhoneHash: string,
  returnedPhoneE164?: string
): Promise<void> {
  if (returnedPhoneE164) {
    const returned_member_phone_hash = await hashE164Phone(returnedPhoneE164);
    if (returned_member_phone_hash !== expectedPhoneHash) {
      track("identity_collision", {
        phone_hash: expectedPhoneHash,
        returned_member_phone_hash,
        member_id,
      });
      return;
    }
  }
  posthog.people?.set?.({ zo_pid: member_id });
  if (typeof window !== "undefined" && window.Moengage) {
    window.Moengage.add_user_attribute("zo_pid", member_id);
  }
}
