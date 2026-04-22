// apps/website/src/components/homecoming/types.ts

export type RankKey =
  | "citizen_day_1"
  | "wanderer"
  | "nomad"
  | "pathfinder"
  | "explorer"
  | "legendary";

export type ObeliskKind = "destinations" | "nights" | "zostels" | "tribe";

export interface RankMeta {
  key: RankKey;
  label: string;
  chip_color: string; // hex
}

export interface ObeliskStat {
  count: number;
  xp: number;
  caption: string;
  rank_jump_to?: RankMeta | null;
}

export interface HomecomingPayload {
  handle: string;
  first_name: string | null;
  avatar_image: string;
  citizen_since: number;
  starting_xp: number;
  total_xp: number;
  final_rank: RankMeta;
  destinations: ObeliskStat;
  nights: ObeliskStat;
  zostels: ObeliskStat;
  tribe: ObeliskStat;
  has_journey: boolean;
}

export interface HomecomingCompleteResponse {
  homecoming_completed_at: string;
  total_xp: number;
  rank: RankKey;
}
