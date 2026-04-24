// apps/website/src/components/homecoming/canvas/LoadingGridline.tsx
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, LineSegments, EdgesGeometry, LineBasicMaterial, GridHelper, AdditiveBlending } from 'three'
import { useCeremonyProgress } from '../state/useCeremonyProgress'

// Stop retraversing the scene once the scene is populated OR we hit this
// many frames without finding anything. Protects against slow asset loads
// where the Suspense boundary hasn't resolved yet and the edge-line pass
// would otherwise hot-loop scene.traverse every frame.
const POPULATE_FRAME_CEILING = 120

export function LoadingGridline() {
  const scene = useThree((s) => s.scene)
  const groupRef = useRef<Group>(null!)
  const linesRef = useRef<LineSegments[]>([])
  const populateAttemptsRef = useRef(0)
  const populatedRef = useRef(false)
  const grid = useMemo(() => {
    const g = new GridHelper(200, 40, 0xffaa77, 0xffaa77)
    g.position.y = 0.02
    return g
  }, [])

  // After mount, collect edge lines for every solid mesh in the scene.
  useFrame(() => {
    const uMat = useCeremonyProgress.getState().uMaterialization
    const wireOpacity = 1 - uMat

    // Lazy-populate edge lines once meshes exist. Bounded by
    // POPULATE_FRAME_CEILING so we stop spinning if assets never load.
    if (!populatedRef.current && populateAttemptsRef.current < POPULATE_FRAME_CEILING) {
      populateAttemptsRef.current += 1
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
      if (linesRef.current.length > 0) {
        populatedRef.current = true
      }
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
