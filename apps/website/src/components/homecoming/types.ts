// apps/website/src/components/homecoming/types.ts
import { z } from 'zod'

export const ProofIdSchema = z.enum(['destinations', 'nights', 'zostels', 'tribe'])
export type ProofId = z.infer<typeof ProofIdSchema>

export const ProofDataSchema = z.object({
  id: ProofIdSchema,
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  accent: z.string().optional(),
})
export type ProofData = z.infer<typeof ProofDataSchema>

export const ZobuDataSchema = z.object({
  modelUrl: z.string().url(),
})
export type ZobuData = z.infer<typeof ZobuDataSchema>

const REQUIRED_PROOF_IDS: ReadonlySet<ProofId> = new Set([
  'destinations', 'nights', 'zostels', 'tribe',
])

export const CeremonyDataSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    handle: z.string().min(1),
    displayName: z.string().min(1),
  }),
  proofs: z.array(ProofDataSchema).length(4).superRefine((proofs, ctx) => {
    const seen = new Set(proofs.map((p) => p.id))
    if (seen.size !== proofs.length || ![...REQUIRED_PROOF_IDS].every((id) => seen.has(id))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'proofs must contain exactly one of each id: destinations, nights, zostels, tribe',
      })
    }
  }),
  zobu: ZobuDataSchema,
  issuedAt: z.string().optional(),
})
export type CeremonyData = z.infer<typeof CeremonyDataSchema>
