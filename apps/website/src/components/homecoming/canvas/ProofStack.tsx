// apps/website/src/components/homecoming/canvas/ProofStack.tsx
import { Proof } from './Proof'
import { ZONES } from '../spine/zones'
import type { ProofData } from '../types'

const ANCHORS: Record<ProofData['id'], number> = {
  destinations: -15,
  nights: -35,
  zostels: -55,
  tribe: -75,
}

const ZONE_FOR: Record<ProofData['id'], keyof typeof ZONES> = {
  destinations: 'proof1',
  nights: 'proof2',
  zostels: 'proof3',
  tribe: 'proof4',
}

export function ProofStack({ proofs }: { proofs: ProofData[] }) {
  return (
    <group>
      {proofs.map((p) => (
        <Proof
          key={p.id}
          data={p}
          zone={ZONES[ZONE_FOR[p.id]]}
          anchorY={ANCHORS[p.id]}
        />
      ))}
    </group>
  )
}
