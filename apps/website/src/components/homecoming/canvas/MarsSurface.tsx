// apps/website/src/components/homecoming/canvas/MarsSurface.tsx
import { useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  TextureLoader,
  RepeatWrapping,
  DoubleSide,
  BackSide,
  Texture,
  Mesh,
  Vector3,
} from 'three'
import { useGLTF } from '@react-three/drei'
import { createDustShader } from '../materials/DustShader'
import type { DeviceTier } from '../hooks/useDeviceTier'

// Mars terrain textures. Dev falls back to solid color when CDN assets are
// missing (see apps/website/public/homecoming-dev/ for local preview assets).
const HAS_CDN_TEXTURES = process.env.NODE_ENV === 'production'
const ALBEDO_URL = 'https://cdn.zo.xyz/homecoming/textures/mars-albedo-2k.jpg'
const NORMAL_URL = 'https://cdn.zo.xyz/homecoming/textures/mars-normal-2k.jpg'

// Module-scoped temp to avoid per-frame allocation (spec §6).
const tmpCamPos = new Vector3()

function MarsTerrainMaterial({ size, segs }: { size: number; segs: number }) {
  if (!HAS_CDN_TEXTURES) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[size, size, segs, segs]} />
        <meshStandardMaterial color="#8a3f28" roughness={0.95} metalness={0.0} />
      </mesh>
    )
  }
  const [albedo, normal] = useLoader(TextureLoader, [ALBEDO_URL, NORMAL_URL]) as [Texture, Texture]
  for (const tex of [albedo, normal]) {
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(32, 32)
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
      <planeGeometry args={[size, size, segs, segs]} />
      <meshStandardMaterial map={albedo} normalMap={normal} roughness={0.95} metalness={0.0} />
    </mesh>
  )
}

// Sketchfab Mars-mud terrain chunk. Sits on top of the procedural base plane
// for sculpted detail in the hero shot; chunk is cloned + scattered so the
// edge is never a single rectangular boundary.
const MARS_SURFACE_URL = '/homecoming-dev/mars-surface/scene.gltf'
useGLTF.preload(MARS_SURFACE_URL)

function MarsMudChunks() {
  const gltf = useGLTF(MARS_SURFACE_URL) as any
  const base = gltf.scene
  // Clone the scene graph once so we can render multiple instances safely.
  const make = () => base.clone(true)
  return (
    <group position={[0, -0.1, 0]}>
      {/* Central chunk directly under the monument, scaled to span ~200 units */}
      <primitive object={make()} scale={[60, 30, 60]} position={[0, 0, 0]} />
      {/* Ring of scattered chunks for horizon texture */}
      <primitive object={make()} scale={[80, 35, 80]} position={[180, 0, -90]} rotation={[0, 0.8, 0]} />
      <primitive object={make()} scale={[75, 32, 75]} position={[-200, 0, -60]} rotation={[0, -1.1, 0]} />
      <primitive object={make()} scale={[70, 30, 70]} position={[120, 0, 180]} rotation={[0, 2.2, 0]} />
      <primitive object={make()} scale={[90, 40, 90]} position={[-160, 0, 160]} rotation={[0, -2.6, 0]} />
    </group>
  )
}

/**
 * Skydome — a large inverted sphere rendered from the inside, with a simple
 * vertical gradient (dark Mars horizon at the top transitioning to red glow
 * at the bottom). Anchored at world origin; large enough that the camera
 * never approaches its shell.
 */
function Skydome() {
  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-10}>
      <sphereGeometry args={[900, 48, 32]} />
      <shaderMaterial
        args={[{
          side: BackSide,
          depthWrite: false,
          depthTest: false,
          uniforms: {
            uTop: { value: [0.06, 0.02, 0.015] },       // deep brown-black at top
            uMid: { value: [0.32, 0.11, 0.06] },        // mars red-brown at horizon
            uBottom: { value: [0.55, 0.22, 0.10] },     // warmer glow below horizon
          },
          vertexShader: /* glsl */ `
            varying vec3 vWorldPos;
            void main() {
              vec4 wp = modelMatrix * vec4(position, 1.0);
              vWorldPos = wp.xyz;
              gl_Position = projectionMatrix * viewMatrix * wp;
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vWorldPos;
            uniform vec3 uTop;
            uniform vec3 uMid;
            uniform vec3 uBottom;
            void main() {
              // Height-based gradient. Normalize by the sphere radius-ish range.
              float h = clamp(vWorldPos.y / 400.0, -1.0, 1.0);
              vec3 color;
              if (h > 0.0) color = mix(uMid, uTop, smoothstep(0.0, 1.0, h));
              else         color = mix(uMid, uBottom, smoothstep(0.0, -1.0, h));
              gl_FragColor = vec4(color, 1.0);
            }
          `,
        }]}
      />
    </mesh>
  )
}

/**
 * Camera-following dust volume. A sphere sized large enough that the camera
 * is always well inside it; re-centers on the camera every frame. Gives the
 * "you are inside the dust" feel without box walls ever coming into view.
 * Limited to the vertical dust zone (y ∈ [-5, -95]) by fading the shader
 * alpha outside that band.
 */
function DustVolume({ dustMat }: { dustMat: ReturnType<typeof createDustShader> }) {
  const meshRef = useRef<Mesh>(null!)
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    if (!meshRef.current) return
    camera.getWorldPosition(tmpCamPos)
    meshRef.current.position.set(tmpCamPos.x, tmpCamPos.y, tmpCamPos.z)
  })
  return (
    <mesh ref={meshRef} material={dustMat} renderOrder={-5}>
      <sphereGeometry args={[60, 32, 24]} />
    </mesh>
  )
}

export function MarsSurface({ tier }: { tier: DeviceTier }) {
  // Ground size is now much larger so the edge never enters frame; visible
  // detail comes from the texture repeat + fog falloff, not the plane rim.
  const size = tier >= 3 ? 2000 : tier >= 2 ? 1200 : 800
  const segs = tier >= 3 ? 256 : tier >= 2 ? 128 : 64

  const dustMode = tier >= 3 ? 'raymarch' : 'billboard'
  const dustMat = useMemo(() => createDustShader(dustMode), [dustMode])

  useFrame((_, delta) => {
    dustMat.uniforms.uTime.value += delta
  })

  return (
    <group>
      <Skydome />
      <MarsTerrainMaterial size={size} segs={segs} />
      <MarsMudChunks />
      <DustVolume dustMat={dustMat} />

      {/* Ringed planet billboard — sits far enough back to live on the sky, not in the dust. */}
      <mesh position={[80, 70, -260]}>
        <sphereGeometry args={[28, 48, 48]} />
        <meshBasicMaterial color="#d4a480" />
      </mesh>
      <mesh position={[80, 70, -260]} rotation={[Math.PI / 2.2, 0.3, 0]}>
        <ringGeometry args={[34, 50, 96]} />
        <meshBasicMaterial color="#e6c89a" transparent opacity={0.7} side={DoubleSide} />
      </mesh>
    </group>
  )
}
