// apps/website/src/components/homecoming/canvas/LoadingGridline.tsx
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, LineSegments, EdgesGeometry, LineBasicMaterial, GridHelper, AdditiveBlending } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'

export function LoadingGridline() {
  const scene = useThree((s) => s.scene)
  const groupRef = useRef<Group>(null!)
  const linesRef = useRef<LineSegments[]>([])
  const grid = useMemo(() => {
    const g = new GridHelper(200, 40, 0xffaa77, 0xffaa77)
    g.position.y = 0.02
    return g
  }, [])

  // After mount, collect edge lines for every solid mesh in the scene.
  useFrame(() => {
    const uMat = useCeremonyProgress.getState().uMaterialization
    const wireOpacity = 1 - uMat

    // Lazy-populate edge lines once meshes exist.
    if (linesRef.current.length === 0) {
      scene.traverse((obj: any) => {
        if (obj.isMesh && obj.geometry && !obj.userData._homecoming_skip_wire) {
          const edges = new EdgesGeometry(obj.geometry)
          const mat = new LineBasicMaterial({
            color: 0xffd9a8,
            transparent: true,
            blending: AdditiveBlending,
            depthWrite: false,
          })
          const line = new LineSegments(edges, mat)
          obj.add(line)
          linesRef.current.push(line)
        }
      })
    }

    linesRef.current.forEach((line) => {
      ;(line.material as LineBasicMaterial).opacity = wireOpacity
      line.visible = wireOpacity > 0.01
    })
    ;(grid.material as any).opacity = wireOpacity * 0.4
    ;(grid.material as any).transparent = true
  })

  return <primitive ref={groupRef} object={grid} />
}
