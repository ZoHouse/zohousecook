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
  // Current location is useful for nearby recommendations, but it cannot be a
  // hard login blocker because browsers can deny or block geolocation.
  // Users can still add it later from location-aware surfaces.
  //
  // WHEREYOULIVE is also intentionally not queued yet: the current profile API
  // does not reliably return/persist that field, so requiring it sends returning
  // users back into onboarding every time.
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
