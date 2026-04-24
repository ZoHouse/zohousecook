// apps/website/src/components/homecoming/canvas/Chamber.tsx
import { useMemo } from 'react'
import { createChromeStoneMaterial } from '../materials/ChromeStoneMaterial'

const FLOOR_RINGS = [
  { r: 10, y: -159.9 },
  { r: 8, y: -159.95 },
  { r: 6, y: -159.97 },
  { r: 4, y: -159.99 },
]

export function Chamber() {
  const pedestalMat = useMemo(() => createChromeStoneMaterial({ pulsePhase: 3.1 }), [])

  return (
    <group>
      {/* Concentric floor rings */}
      {FLOOR_RINGS.map((r, i) => (
        <mesh key={i} position={[0, r.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r.r - 0.08, r.r, 96]} />
          <meshBasicMaterial color="#d8cfc6" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Pedestal */}
      <mesh position={[0, -157, 0]} material={pedestalMat}>
        <cylinderGeometry args={[1.3, 1.5, 2, 48]} />
      </mesh>

      {/* Ceiling light ring */}
      <mesh position={[0, -145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.12, 16, 64]} />
        <meshBasicMaterial color="#fff1dd" toneMapped={false} />
      </mesh>
    </group>
  )
}
