// apps/website/src/components/homecoming/canvas/MarsSurface.tsx
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DoubleSide, BackSide, Mesh, Vector3 } from 'three'
import { createDustShader } from '../materials/DustShader'
import type { DeviceTier } from '../hooks/useDeviceTier'

// Module-scoped temp to avoid per-frame allocation (spec §6).
const tmpCamPos = new Vector3()

/**
 * Sand terrain — a large plane with a procedural sand shader. Warm tan
 * palette with layered noise for dune-like variation. Displaced slightly in
 * the vertex shader so the surface isn't perfectly flat. Much more readable
 * than a dark mud chunk model when the camera stands up close to it.
 */
function SandTerrain({ size, segs }: { size: number; segs: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[size, size, segs, segs]} />
      <shaderMaterial
        args={[{
          uniforms: {
            uLight: { value: [0xeb / 255, 0xcf / 255, 0xa2 / 255] }, // warm highlight
            uMid:   { value: [0xcf / 255, 0xa8 / 255, 0x70 / 255] }, // sand body
            uDark:  { value: [0x7a / 255, 0x58 / 255, 0x38 / 255] }, // shadow grains
            uDeep:  { value: [0x3b / 255, 0x2a / 255, 0x1d / 255] }, // deepest ripple
          },
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            varying float vHeight;

            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float vnoise(vec2 p) {
              vec2 i = floor(p), f = fract(p);
              float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
              vec2 u = f*f*(3.0-2.0*f);
              return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
            }

            void main() {
              vUv = uv;
              // Coarse dunes + fine ripple displacement. UV-driven so it stays
              // stable as the camera moves; amplitude is small so the plane
              // still reads as a horizon line.
              float dune = vnoise(uv * 12.0) - 0.5;
              float ripple = vnoise(uv * 80.0) - 0.5;
              // Keep peak dune under +0.35 world units so geometry sitting at
              // y=0 never clips through the surface. Shading still reads with
              // this smaller amplitude because the fragment shader adds grain.
              vHeight = dune * 0.55 + ripple * 0.08;
              vec3 displaced = position + vec3(0.0, 0.0, vHeight);  // local z = world y after the -PI/2 rotation
              gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            varying float vHeight;
            uniform vec3 uLight;
            uniform vec3 uMid;
            uniform vec3 uDark;
            uniform vec3 uDeep;

            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float vnoise(vec2 p) {
              vec2 i = floor(p), f = fract(p);
              float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
              vec2 u = f*f*(3.0-2.0*f);
              return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
            }

            void main() {
              // Multi-octave noise keyed to world-scale repeat for grain detail.
              vec2 p = vUv * 180.0;
              float g = 0.0, amp = 0.5;
              for (int i = 0; i < 4; i++) {
                g += vnoise(p) * amp;
                p *= 2.01;
                amp *= 0.55;
              }
              // Broader dune shading reuses the vertex-displacement height.
              float shade = clamp(0.5 + vHeight * 0.35 + (g - 0.5) * 0.6, 0.0, 1.0);

              vec3 color = mix(uDeep, uDark, smoothstep(0.0, 0.35, shade));
              color = mix(color, uMid, smoothstep(0.3, 0.65, shade));
              color = mix(color, uLight, smoothstep(0.65, 1.0, shade));

              gl_FragColor = vec4(color, 1.0);
            }
          `,
        }]}
      />
    </mesh>
  )
}

/**
 * Skydome — large inverted sphere with a subtle vertical gradient. Near-black
 * at top, muted Mars tint at horizon, warm terracotta below.
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
            uTop: { value: [0.015, 0.012, 0.018] },     // near-black
            uMid: { value: [0.14, 0.08, 0.07] },        // muted Mars brown-gray at horizon
            uBottom: { value: [0.22, 0.13, 0.10] },     // terracotta below
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
 * Camera-following dust volume. A sphere centered on the camera so its walls
 * never come into frame. Alpha attenuated by y-zone + near/far view distance.
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
      <SandTerrain size={size} segs={segs} />
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
