// apps/website/src/components/homecoming/state/useCeremonyProgress.ts
import { create } from 'zustand'

type ProgressStore = {
  t: number
  tLerp: number
  uMaterialization: number
  introDone: boolean
  setT: (t: number) => void
  setTLerp: (t: number) => void
  setMaterialization: (v: number) => void
  setIntroDone: () => void
  reset: () => void
}

export const useCeremonyProgress = create<ProgressStore>((set) => ({
  t: 0,
  tLerp: 0,
  uMaterialization: 0,
  introDone: false,
  setT: (t) => set({ t }),
  setTLerp: (tLerp) => set({ tLerp }),
  setMaterialization: (uMaterialization) => set({ uMaterialization }),
  setIntroDone: () => set({ introDone: true }),
  reset: () => set({ t: 0, tLerp: 0, uMaterialization: 0, introDone: false }),
}))
