// apps/website/src/components/homecoming/canvas/MarsSurface.tsx
import { useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader, RepeatWrapping, DoubleSide } from 'three'
import { createDustShader } from '../materials/DustShader'
import type { DeviceTier } from '../hooks/useDeviceTier'

const ALBEDO_URL = 'https://cdn.zo.xyz/homecoming/textures/mars-albedo-2k.jpg'
const NORMAL_URL = 'https://cdn.zo.xyz/homecoming/textures/mars-normal-2k.jpg'

export function MarsSurface({ tier }: { tier: DeviceTier }) {
  const [albedo, normal] = useLoader(TextureLoader, [ALBEDO_URL, NORMAL_URL])
  for (const tex of [albedo, normal]) {
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(8, 8)
  }

  const size = tier >= 3 ? 200 : tier >= 2 ? 120 : 80
  const segs = tier >= 3 ? 128 : tier >= 2 ? 64 : 32

  const dustMode = tier >= 3 ? 'raymarch' : 'billboard'
  const dustMat = useMemo(() => createDustShader(dustMode), [dustMode])

  useFrame((_, delta) => {
    dustMat.uniforms.uTime.value += delta
  })

  return (
    <group>
      {/* Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[size, size, segs, segs]} />
        <meshStandardMaterial map={albedo} normalMap={normal} roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Dust volume — tall slab from y=-5 to y=-95 centered on spine axis.
          DustShader renders DoubleSide so it's visible while camera is inside. */}
      <mesh position={[0, -50, 0]} material={dustMat}>
        <boxGeometry args={[80, 90, 80]} />
      </mesh>

      {/* Ringed planet billboard */}
      <mesh position={[30, 22, -80]}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color="#d4a480" />
      </mesh>
      <mesh position={[30, 22, -80]} rotation={[Math.PI / 2.2, 0.3, 0]}>
        <ringGeometry args={[12, 18, 64]} />
        <meshBasicMaterial color="#e6c89a" transparent opacity={0.7} side={DoubleSide} />
      </mesh>
    </group>
  )
}
