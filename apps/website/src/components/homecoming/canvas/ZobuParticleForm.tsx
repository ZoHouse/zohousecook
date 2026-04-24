// apps/website/src/components/homecoming/canvas/ZobuParticleForm.tsx
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import {
  BufferGeometry, BufferAttribute, Points, ShaderMaterial, Vector3,
  EdgesGeometry, LineSegments, LineBasicMaterial, AdditiveBlending, Mesh, MathUtils,
} from 'three'
import type { DeviceTier } from '../hooks/useDeviceTier'
import { readBeatProgress } from '../hooks/useBeatProgress'
import { ZONES } from '../spine/zones'

const POINTS_PER_TIER: Record<DeviceTier, number> = { 0: 8000, 1: 8000, 2: 20000, 3: 40000 }

export function ZobuParticleForm({ modelUrl, tier }: { modelUrl: string; tier: DeviceTier }) {
  const pointCount = POINTS_PER_TIER[tier]
  const { scene: zobuScene } = useGLTF(modelUrl) as any

  // Find first mesh in the loaded zobu.
  const zobuMesh = useMemo<Mesh | null>(() => {
    let m: Mesh | null = null
    zobuScene.traverse((o: any) => { if (!m && o.isMesh) m = o as Mesh })
    return m
  }, [zobuScene])

  // Build wireframe line segments.
  const wireframe = useMemo(() => {
    if (!zobuMesh) return null
    const edges = new EdgesGeometry(zobuMesh.geometry)
    const mat = new LineBasicMaterial({
      color: 0xd8cfc6,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    })
    return new LineSegments(edges, mat)
  }, [zobuMesh])

  // Build point cloud.
  const { geometry: pointGeom, targetPositions, spawnOffsets, sampledNormals } = useMemo(() => {
    if (!zobuMesh) return { geometry: null, targetPositions: null, spawnOffsets: null, sampledNormals: null }
    const sampler = new MeshSurfaceSampler(zobuMesh).build()
    const targets = new Float32Array(pointCount * 3)
    const offsets = new Float32Array(pointCount * 3)
    const normals = new Float32Array(pointCount * 3)
    const positions = new Float32Array(pointCount * 3)
    const tmp = new Vector3()
    const tmpNormal = new Vector3()
    for (let i = 0; i < pointCount; i++) {
      sampler.sample(tmp, tmpNormal)
      targets[i * 3 + 0] = tmp.x
      targets[i * 3 + 1] = tmp.y
      targets[i * 3 + 2] = tmp.z
      normals[i * 3 + 0] = tmpNormal.x
      normals[i * 3 + 1] = tmpNormal.y
      normals[i * 3 + 2] = tmpNormal.z
      // Random offset for initial scatter
      offsets[i * 3 + 0] = (Math.random() - 0.5) * 4
      offsets[i * 3 + 1] = (Math.random() - 0.5) * 4
      offsets[i * 3 + 2] = (Math.random() - 0.5) * 4
      positions[i * 3 + 0] = targets[i * 3 + 0] + offsets[i * 3 + 0]
      positions[i * 3 + 1] = targets[i * 3 + 1] + offsets[i * 3 + 1]
      positions[i * 3 + 2] = targets[i * 3 + 2] + offsets[i * 3 + 2]
    }
    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(positions, 3))
    return { geometry: geom, targetPositions: targets, spawnOffsets: offsets, sampledNormals: normals }
  }, [zobuMesh, pointCount])

  const pointMat = useMemo(() => new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uOpacity: { value: 0 }, uSize: { value: tier >= 3 ? 2.4 : 1.8 } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (120.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.2, length(p));
        gl_FragColor = vec4(0.93, 0.88, 0.82, a * uOpacity);
      }
    `,
  }), [tier])

  const pointsRef = useRef<Points | null>(null)
  const wireRef = useRef<LineSegments | null>(null)

  useEffect(() => {
    if (wireframe) wireRef.current = wireframe
  }, [wireframe])

  // Dispose GPU resources on unmount or when memo deps change.
  useEffect(() => {
    return () => {
      wireframe?.geometry.dispose()
      ;(wireframe?.material as LineBasicMaterial | undefined)?.dispose()
      pointGeom?.dispose()
      pointMat?.dispose()
    }
  }, [wireframe, pointGeom, pointMat])

  useFrame((_, delta) => {
    const u = readBeatProgress(ZONES.chamberReveal)
    // 0-0.5: wireframe stage. 0.5-1: particle stage.
    const wireOpacity = u < 0.5 ? (u / 0.5) : Math.max(0, 1 - (u - 0.5) / 0.2)
    const pointOpacity = u < 0.4 ? 0 : MathUtils.clamp((u - 0.4) / 0.4, 0, 1)

    if (wireRef.current) {
      ;(wireRef.current.material as LineBasicMaterial).opacity = wireOpacity
      wireRef.current.visible = wireOpacity > 0.01
    }
    pointMat.uniforms.uOpacity.value = pointOpacity
    if (pointsRef.current) pointsRef.current.visible = pointOpacity > 0.01

    // Condensation: lerp current positions toward targets based on particle stage progress.
    if (pointGeom && targetPositions && spawnOffsets && sampledNormals) {
      const progress = MathUtils.clamp((u - 0.5) / 0.4, 0, 1)
      const arr = pointGeom.attributes.position.array as Float32Array
      for (let i = 0; i < pointCount; i++) {
        const tx = targetPositions[i * 3 + 0]
        const ty = targetPositions[i * 3 + 1]
        const tz = targetPositions[i * 3 + 2]
        const ox = spawnOffsets[i * 3 + 0] * (1 - progress)
        const oy = spawnOffsets[i * 3 + 1] * (1 - progress)
        const oz = spawnOffsets[i * 3 + 2] * (1 - progress)
        // Breathing term once resolved: oscillate along surface normals
        const b = progress > 0.95 ? 0.02 * Math.sin(performance.now() / 500 + i * 0.01) : 0
        const nx = sampledNormals[i * 3 + 0]
        const ny = sampledNormals[i * 3 + 1]
        const nz = sampledNormals[i * 3 + 2]
        arr[i * 3 + 0] = tx + ox + nx * b
        arr[i * 3 + 1] = ty + oy + ny * b
        arr[i * 3 + 2] = tz + oz + nz * b
      }
      pointGeom.attributes.position.needsUpdate = true
    }
  })

  if (!pointGeom || !wireframe) return null

  return (
    <group position={[0, -155, 0]} scale={[1.2, 1.2, 1.2]}>
      <primitive object={wireframe} />
      <points ref={pointsRef} geometry={pointGeom} material={pointMat} />
    </group>
  )
}
