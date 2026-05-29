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
  // Both pieces are required for the Hometown step to be considered done:
  //   place_name    — human-readable city ("Bengaluru, Karnataka, India")
  //   home_location — PostGIS Point ({lat, lng}) the passport recommender reads
  //
  // Pre-PR #145 the Hometown step had a string-match bug that silently
  // dropped lat/lng when the typed text didn't exactly equal the picked
  // place_name (which is almost always — Google returns "Bengaluru,
  // Karnataka, India" for a typed "bangalore"). Those users have
  // `place_name` set but `home_location` null. Without the second clause
  // they'd pass this gate forever and the recommender's
  //   coordinates = user.last_known_coordinates or user.home_coordinates
  // check would always return none() — they'd see zero quests on every
  // login. Including !home_location naturally re-prompts them on next
  // login, and PR #145 ensures the re-submit persists both fields.
  if (!profile.place_name || !profile.home_location) {
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
