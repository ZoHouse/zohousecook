// apps/website/src/components/homecoming/materials/ChromeStoneMaterial.ts
import { Color, MeshPhysicalMaterial, Texture } from 'three'

export type ChromeStoneOptions = {
  albedo?: Texture
  normalMap?: Texture
  roughnessMap?: Texture
  envMapIntensity?: number
  pulseColor?: Color
  pulseBaseline?: number
  pulseAmplitude?: number
  pulsePhase?: number
}

/**
 * Pure factory. Returns a MeshPhysicalMaterial configured for chrome-stone
 * with userData slots holding pulse state.
 *
 * Consumers are responsible for writing `material.emissiveIntensity` inside
 * their own useFrame loop, typically via `applyChromeStonePulse(material)`
 * below. Three.js does not have a material-level per-frame hook, so the
 * pattern is: factory seeds state + helper, consumers drive it.
 */
export function createChromeStoneMaterial(opts: ChromeStoneOptions = {}): MeshPhysicalMaterial {
  const {
    albedo,
    normalMap,
    roughnessMap,
    envMapIntensity = 1.4,
    pulseColor = new Color(0xffd9a8),
    pulseBaseline = 0.25,
    pulseAmplitude = 0.75,
    pulsePhase = 0,
  } = opts

  const mat = new MeshPhysicalMaterial({
    color: 0x8a6a5a,
    map: albedo,
    normalMap,
    roughnessMap,
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity,
    emissive: pulseColor.clone(),
    emissiveIntensity: pulseBaseline,
  })

  mat.userData.pulseBaseline = pulseBaseline
  mat.userData.pulseAmplitude = pulseAmplitude
  mat.userData.pulsePhase = pulsePhase
  mat.userData.pulseHoverBoost = 0
  mat.userData.pulseProximity = 0
  mat.userData.uMaterialization = 1

  return mat
}

/**
 * Call every frame from the consumer's useFrame. Computes emissiveIntensity
 * from the material's userData slots and writes it to the material. Consumers
 * mutate userData.pulseHoverBoost / pulseProximity / uMaterialization as needed.
 */
export function applyChromeStonePulse(mat: MeshPhysicalMaterial): void {
  const b = (mat.userData.pulseBaseline ?? 0.25) as number
  const a = (mat.userData.pulseAmplitude ?? 0.75) as number
  const boost = (mat.userData.pulseHoverBoost ?? 0) as number
  const proximity = (mat.userData.pulseProximity ?? 0) as number
  const uMat = (mat.userData.uMaterialization ?? 1) as number
  mat.emissiveIntensity = (b + a * (boost + proximity)) * uMat
}
