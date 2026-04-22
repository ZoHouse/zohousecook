// [x, y (top of obelisk), z] for each obelisk, used by:
// - Obelisk.tsx (body position)
// - LightRibbon.tsx (from)
// - ObeliskCaption.tsx mounted as a child of Obelisk (projected)
export const OBELISK_WORLD_POSITIONS: Array<[number, number, number]> = [
  [-3, 2, -1],
  [-1, 2, -1],
  [ 1, 2, -1],
  [ 3, 2, -1],
];
