import { useMemo } from 'react';
import type { RoomMember } from './useRoom';

export interface PedestalSlot {
  position: [number, number, number];
  scale: number;
  member: RoomMember | null;
  isSelf: boolean;
  isEmpty: boolean;
}

// 5 pedestals in a tight line — fits center column between UI panels
const SLOT_LAYOUT: { position: [number, number, number]; scale: number }[] = [
  { position: [0, 0, -0.15], scale: 1.0 },         // Slot 0: YOU — center, slightly forward
  { position: [-1.05, 0, 0.1], scale: 0.9 },       // Slot 1: Guest A — left
  { position: [1.05, 0, 0.1], scale: 0.9 },        // Slot 2: Guest B — right
  { position: [-2.05, 0, 0.25], scale: 0.82 },     // Slot 3: Guest C — far-left
  { position: [2.05, 0, 0.25], scale: 0.82 },      // Slot 4: Guest D — far-right
];

export function usePedestalSlots(
  members: RoomMember[],
  selfCode?: string
): PedestalSlot[] {
  return useMemo(() => {
    const selfMember = members.find((m) => m.code === selfCode) || null;
    const guests = members.filter((m) => m.code !== selfCode).slice(0, 4);

    return SLOT_LAYOUT.map((layout, i) => {
      if (i === 0) {
        return { ...layout, member: selfMember, isSelf: true, isEmpty: !selfMember };
      }
      const guest = guests[i - 1] || null;
      return { ...layout, member: guest, isSelf: false, isEmpty: !guest };
    });
  }, [members, selfCode]);
}
