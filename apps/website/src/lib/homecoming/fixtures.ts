// apps/website/src/lib/homecoming/fixtures.ts

import type { HomecomingPayload } from "../../components/homecoming/types";

export const LEGENDARY_FIXTURE: HomecomingPayload = {
  handle: "tysonkong.zo",
  first_name: "Adam",
  avatar_image: "https://static.cdn.zo.xyz/avatars/default-zobu.png",
  citizen_since: 2016,
  starting_xp: 2000,
  total_xp: 27550,
  final_rank: { key: "legendary", label: "Legendary", chip_color: "#FEDD1E" },
  has_journey: true,
  destinations: { count: 39,  xp: 1950, caption: "39 stamps received" },
  nights:       { count: 199, xp: 9950, caption: "199 nights under Zo skies",
                  rank_jump_to: { key: "nomad", label: "Nomad", chip_color: "#89B020" } },
  zostels:      { count: 42,  xp: 8400, caption: "42 roofs you've called home" },
  tribe:        { count: 34,  xp: 7200, caption: "34 souls you've walked with",
                  rank_jump_to: { key: "legendary", label: "Legendary", chip_color: "#FEDD1E" } },
};

export const ZERO_STATE_FIXTURE: HomecomingPayload = {
  handle: "martianpotato.zo",
  first_name: null,
  avatar_image: "https://static.cdn.zo.xyz/avatars/default-zobu.png",
  citizen_since: new Date().getFullYear(),
  starting_xp: 0,
  total_xp: 0,
  final_rank: { key: "citizen_day_1", label: "Day 1", chip_color: "#CFFF50" },
  has_journey: false,
  destinations: { count: 0, xp: 0, caption: "Your first destination awaits" },
  nights:       { count: 0, xp: 0, caption: "Your first night is on us" },
  zostels:      { count: 0, xp: 0, caption: "Find your first Zostel" },
  tribe:        { count: 0, xp: 0, caption: "Your tribe is out there" },
};
