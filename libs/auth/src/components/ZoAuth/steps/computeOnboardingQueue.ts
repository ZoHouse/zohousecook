import { Profile } from "@zo/definitions/auth";
import { WhereaboutsRecord } from "../../../utils/whereabouts";
import { ZoAuthStep } from "../ZoAuth";

export function computeOnboardingQueue(
  profile: Profile,
  whereabouts: WhereaboutsRecord | null
): ZoAuthStep[] {
  const queue: ZoAuthStep[] = [];

  if (!profile.custom_nickname && !profile.ens_nickname) {
    queue.push("NICKNAME");
  }
  if (!profile.body_type) {
    queue.push("AVATAR");
  }
  if (!whereabouts) {
    queue.push("WHEREABOUTS");
  }
  // Where do you live = semi-permanent residence city. Distinct from
  // WHEREABOUTS (live geo) and HOMETOWN (where grew up). Backend column
  // not yet wired (Daya queued); profile.where_do_you_live will be
  // undefined for now, so the step keeps appearing every onboarding
  // until either the column ships or this guard is updated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(profile as any).where_do_you_live) {
    queue.push("WHEREYOULIVE");
  }
  if (!profile.country?.code) {
    queue.push("CITIZEN");
  }
  if (!profile.place_name) {
    queue.push("HOMETOWN");
  }
  if (!profile.date_of_birth) {
    queue.push("BIRTHDAY");
  }
  if (!profile.cultures || profile.cultures.length < 1) {
    queue.push("CULTURES");
  }

  return queue;
}
