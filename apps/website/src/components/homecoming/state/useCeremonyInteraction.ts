// apps/website/src/components/homecoming/state/useCeremonyInteraction.ts
import { create } from 'zustand'

type InteractionStore = {
  monumentHovered: boolean
  audioEnabled: boolean
  ctaClicked: boolean
  setMonumentHovered: (v: boolean) => void
  toggleAudio: () => void
  fireCTA: () => void
}

export const useCeremonyInteraction = create<InteractionStore>((set) => ({
  monumentHovered: false,
  audioEnabled: false,
  ctaClicked: false,
  setMonumentHovered: (monumentHovered) => set({ monumentHovered }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  fireCTA: () => set({ ctaClicked: true }),
}))
