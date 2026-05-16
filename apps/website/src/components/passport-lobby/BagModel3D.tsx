import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { DecalGeometry } from 'three-stdlib';
import { stampUrlFor } from '../../lib/passport/stampUrl';

// Webpack emits this as /_next/static/media/carry_on.<hash>.glb via the
// asset/resource rule in apps/website/next.config.js. Self-contained binary.
// This is "The Zipper Carry-On Max_v003.glb" lifted from the badvati prototype
// — heavier (~15 MB) but the geometry/materials are designed for stickers.
import MODEL_URL from '../../assets/3d/carry_on.glb';

// Orange tint on the suitcase's largest material (the body shell). Warm
// saturated orange lets stamp art still pop while giving the bag a premium
// travel-brand feel. Original normal/roughness maps are kept so panel
// detail still shows through the recolor.
const GOLD_COLOR = new THREE.Color('#E55A1C');
const GOLD_METALNESS = 0.25;
const GOLD_ROUGHNESS = 0.5;

export interface BagModel3DProps {
  onClick?: () => void;
  /** Square footprint on the pedestal. */
  size?: number;
  /** Earned stamp names — auto-placed as decals on the bag's front face. */
  stamps?: string[];
}

const DEFAULT_SIZE = 324;

// After auto-normalize the longest axis becomes this length.
const TARGET_SIZE = 1.55;

// Number of stickers we'll attempt to place. Stickers map to the first N
// earned stamps, in order. The auto-place pass casts rays from the default
// camera direction to a 4×2 grid; we keep N modest so the bag isn't covered.
const MAX_STICKERS = 8;

const STICKER_WORLD_SCALE = 0.26;

// Stamps are rasterized at this resolution via createImageBitmap before
// being uploaded as a GPU texture. The source URLs are mostly SVGs whose
// intrinsic viewBox is small (~64 px) — without explicit resize, the
// browser rasterizes the SVG at viewBox size and any later upscale just
// blurs that. createImageBitmap with resizeWidth/Height tells the rasterizer
// to render the SVG (or resample the PNG) at the target size directly.
const STICKER_TEXTURE_PX = 1024;

// Minimum 3D-space distance between any two sticker centres on the bag's
// face. Keeps random placement from clustering/overlapping.
const STICKER_MIN_SPACING = STICKER_WORLD_SCALE * 0.85;

// Cheap deterministic PRNG so the same stamp name always lands in the same
// spot on the bag — stickers shouldn't shuffle every render.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Load a stamp URL into a sharp ImageBitmap-backed texture at
 * STICKER_TEXTURE_PX. createImageBitmap with resizeWidth/Height tells the
 * browser to rasterize SVGs (or high-quality resample PNGs) at the requested
 * resolution directly — without it, SVG sources rasterize at their tiny
 * intrinsic viewBox and any later upscale just blurs.
 */
function makeTexture(source: ImageBitmap | HTMLCanvasElement, maxAniso: number) {
  const tex = new THREE.CanvasTexture(source);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Some Zostel-CDN stamp SVGs ship with only a `viewBox` and no intrinsic
 * width/height. createImageBitmap then either fails or returns 0×0, leaving
 * the decal blank. Re-write the root <svg> tag with explicit dimensions so
 * the rasterizer renders at our target size.
 */
function svgWithExplicitSize(text: string, px: number): string {
  // Drop any existing width/height on the root svg, then inject ours.
  const cleaned = text.replace(
    /<svg\b[^>]*?>/i,
    (tag) => {
      const stripped = tag
        .replace(/\swidth="[^"]*"/i, '')
        .replace(/\sheight="[^"]*"/i, '');
      return stripped.replace(/<svg\b/i, `<svg width="${px}" height="${px}"`);
    },
  );
  return cleaned;
}

async function loadSharpStickerTexture(
  url: string,
  maxAniso: number,
  onReady: (tex: THREE.Texture) => void,
): Promise<void> {
  try {
    // Route through same-origin proxy so cross-origin stamps (Zostel CDN
    // SVGs in particular) don't taint the WebGL texture upload. The proxy
    // adds CORS headers and lets us read the raw bytes.
    const proxied = `/api/stamp-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied, { referrerPolicy: 'no-referrer' });
    if (!res.ok) return;
    const ct = (res.headers.get('content-type') || '').toLowerCase();

    if (ct.includes('svg')) {
      // SVG path — fetch as text, inject width/height, draw via Image to a
      // canvas at STICKER_TEXTURE_PX. This is the only reliable way to get
      // a viewBox-only SVG to rasterize at a chosen resolution.
      const text = await res.text();
      const sized = svgWithExplicitSize(text, STICKER_TEXTURE_PX);
      const blob = new Blob([sized], { type: 'image/svg+xml' });
      const objUrl = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('svg image load failed'));
          img.src = objUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = STICKER_TEXTURE_PX;
        canvas.height = STICKER_TEXTURE_PX;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, STICKER_TEXTURE_PX, STICKER_TEXTURE_PX);
        onReady(makeTexture(canvas, maxAniso));
      } finally {
        URL.revokeObjectURL(objUrl);
      }
      return;
    }

    // Raster path (PNG/JPG/WEBP) — createImageBitmap handles resize natively.
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: STICKER_TEXTURE_PX,
      resizeHeight: STICKER_TEXTURE_PX,
      resizeQuality: 'high',
    });
    onReady(makeTexture(bitmap, maxAniso));
  } catch {
    /* keep decal blank on load failure */
  }
}

interface PlacedSticker {
  position: [number, number, number];
  normal: [number, number, number];
  rotation: number;
  meshUUID: string;
}

/**
 * Loads the suitcase, auto-scales it to TARGET_SIZE, centers it at the origin,
 * and reports the largest-by-volume body mesh up so the decal layer can
 * raycast against it.
 */
function NormalizedSuitcase({
  onBodyReady,
}: {
  onBodyReady: (mesh: THREE.Mesh) => void;
}) {
  const { scene: gltfScene } = useGLTF(MODEL_URL as string);
  const groupRef = useRef<THREE.Group>(null!);
  const settledRef = useRef(false);

  useEffect(() => {
    // Find the largest mesh by bbox volume up front — that's the body we
    // want to recolor gold (smaller meshes are zips, handles, wheels).
    let bodyVol = 0;
    let bodyUUID: string | null = null;
    gltfScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      if (!bb) return;
      const sz = bb.getSize(new THREE.Vector3());
      const v = sz.x * sz.y * sz.z;
      if (v > bodyVol) {
        bodyVol = v;
        bodyUUID = mesh.uuid;
      }
    });

    gltfScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (!(m && m.isMeshStandardMaterial)) return;
        m.envMapIntensity = 0.7;
        if (mesh.uuid === bodyUUID) {
          // Tint the body gold while keeping any normal/roughness maps so
          // texture detail reads through the recolor.
          m.color.copy(GOLD_COLOR);
          m.metalness = GOLD_METALNESS;
          m.roughness = GOLD_ROUGHNESS;
          // The original albedo map fights the tint; drop it so the gold
          // shows pure. Detail maps (normal/roughness) are kept.
          m.map = null;
          m.needsUpdate = true;
        }
      });
    });
  }, [gltfScene]);

  // World matrices aren't valid until the first frame after mount, so we
  // measure + scale + center then.
  useFrame(() => {
    if (settledRef.current || !groupRef.current) return;
    settledRef.current = true;

    const box = new THREE.Box3().setFromObject(groupRef.current);
    if (box.isEmpty()) return;
    const size = new THREE.Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.y, size.z);
    if (longest === 0) return;
    const s = TARGET_SIZE / longest;
    const center = new THREE.Vector3();
    box.getCenter(center);
    groupRef.current.scale.setScalar(s);
    groupRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
    groupRef.current.updateMatrixWorld(true);

    // Find the largest mesh by volume — that's the suitcase body. Smaller
    // meshes (handles, wheels, zips) are skipped so stickers don't try to
    // wrap around tiny features.
    let largest: THREE.Mesh | null = null;
    let largestVolume = 0;
    groupRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const b = new THREE.Box3().setFromObject(mesh);
      const sz = new THREE.Vector3();
      b.getSize(sz);
      const v = sz.x * sz.y * sz.z;
      if (v > largestVolume) {
        largestVolume = v;
        largest = mesh;
      }
    });
    if (largest) onBodyReady(largest);
  });

  return (
    <group ref={groupRef}>
      <primitive object={gltfScene} />
    </group>
  );
}

/**
 * Renders one DecalGeometry on the body mesh, anchored to a surface position
 * + face normal. Loads the stamp PNG as the decal's albedo map.
 */
function StickerDecal({
  body,
  url,
  position,
  normal,
  rotation,
}: {
  body: THREE.Mesh;
  url: string;
  position: [number, number, number];
  normal: [number, number, number];
  rotation: number;
}) {
  const { scene, gl } = useThree();
  const decalRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    body.updateWorldMatrix(true, true);
    const pos = new THREE.Vector3(...position);
    const n = new THREE.Vector3(...normal).normalize();
    const baseQ = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      n,
    );
    const tiltQ = new THREE.Quaternion().setFromAxisAngle(n, rotation);
    const orient = new THREE.Euler().setFromQuaternion(
      tiltQ.clone().multiply(baseQ),
      'XYZ',
    );
    const s = STICKER_WORLD_SCALE;
    let geometry: THREE.BufferGeometry;
    try {
      geometry = new DecalGeometry(body, pos, orient, new THREE.Vector3(s, s, s * 2));
    } catch {
      return;
    }
    if ((geometry.attributes.position?.count ?? 0) === 0) {
      geometry.dispose();
      return;
    }

    const mat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 1,
      alphaTest: 0.05,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -8,
      polygonOffsetUnits: -8,
      roughness: 0.45,
      metalness: 0,
    });
    const decal = new THREE.Mesh(geometry, mat);
    decal.renderOrder = 10;
    scene.add(decal);
    decalRef.current = decal;

    loadSharpStickerTexture(url, gl.capabilities.getMaxAnisotropy(), (tex) => {
      if (!decalRef.current) return;
      const m = decalRef.current.material as THREE.MeshStandardMaterial;
      m.map = tex;
      m.needsUpdate = true;
    });

    return () => {
      const m = decalRef.current;
      if (!m) return;
      m.removeFromParent();
      const mm = m.material as THREE.MeshStandardMaterial;
      mm.map?.dispose();
      mm.dispose();
      m.geometry.dispose();
      decalRef.current = null;
    };
  }, [body, url, position, normal, rotation, scene]);

  return null;
}

/**
 * Once the body mesh is known, cast a 4×2 grid of rays from the default
 * camera direction toward the bag and turn each hit into a sticker placement.
 * Rays whose direction matches the camera mean the hits sit on the face we
 * see by default — which is the natural place to put stickers.
 */
function StickerLayer({ body, urls }: { body: THREE.Mesh; urls: string[] }) {
  const placements = useMemo<PlacedSticker[]>(() => {
    if (!body || urls.length === 0) return [];
    body.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(body);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Find the largest face direction by comparing the bbox dimensions in
    // world axes. The two longest axes become the "face plane"; the shortest
    // axis becomes the face normal direction. For a flat suitcase that picks
    // the lid surface naturally.
    const axes: Array<{ axis: 'x' | 'y' | 'z'; len: number }> = (
      [
        { axis: 'x', len: size.x },
        { axis: 'y', len: size.y },
        { axis: 'z', len: size.z },
      ] as const
    )
      .map((a) => ({ axis: a.axis, len: a.len }))
      .sort((a, b) => a.len - b.len);
    const normalAxis = axes[0].axis;
    const planeAxes = [axes[1].axis, axes[2].axis] as Array<'x' | 'y' | 'z'>;

    const normalDir = new THREE.Vector3(
      normalAxis === 'x' ? 1 : 0,
      normalAxis === 'y' ? 1 : 0,
      normalAxis === 'z' ? 1 : 0,
    );

    // Cast rays from a point above the front face down toward the bag. The
    // grid spans 60% of each plane axis so stickers stay inset from the edge.
    const planeMin: Record<'x' | 'y' | 'z', number> = {
      x: center.x - size.x * 0.3,
      y: center.y - size.y * 0.3,
      z: center.z - size.z * 0.3,
    };
    const planeMax: Record<'x' | 'y' | 'z', number> = {
      x: center.x + size.x * 0.3,
      y: center.y + size.y * 0.3,
      z: center.z + size.z * 0.3,
    };
    const a0 = planeAxes[0];
    const a1 = planeAxes[1];

    const rayOriginNormalDistance = size[normalAxis] * 2 + 0.5;

    // Seeded-random placement — each stamp gets a stable position derived
    // from its name, so layouts don't reshuffle every render. Rejection
    // sampling against STICKER_MIN_SPACING keeps stickers from overlapping.
    const rc = new THREE.Raycaster();
    const out: PlacedSticker[] = [];

    for (let i = 0; i < urls.length; i += 1) {
      const seed = hashString(urls[i] + ':' + i);
      const rng = mulberry32(seed);
      let placed: PlacedSticker | null = null;

      // Try a handful of random positions; the first one that hits the bag
      // and is far enough from existing stickers wins.
      for (let attempt = 0; attempt < 24 && !placed; attempt += 1) {
        const tA = rng();
        const tB = rng();
        const origin = new THREE.Vector3(center.x, center.y, center.z);
        // Inset 10% from each edge so stickers don't tuck under the rim.
        origin[a0] = planeMin[a0] + (planeMax[a0] - planeMin[a0]) * (0.1 + tA * 0.8);
        origin[a1] = planeMin[a1] + (planeMax[a1] - planeMin[a1]) * (0.1 + tB * 0.8);
        origin[normalAxis] = center[normalAxis] + rayOriginNormalDistance;
        const dir = normalDir.clone().multiplyScalar(-1);
        rc.set(origin, dir);
        const hits = rc.intersectObject(body, false);
        if (hits.length === 0 || !hits[0].face) continue;
        const point = hits[0].point.clone();

        // Spacing check — bail if too close to an already-placed sticker.
        const tooClose = out.some(
          (p) =>
            new THREE.Vector3(...p.position).distanceTo(point) < STICKER_MIN_SPACING,
        );
        if (tooClose) continue;

        const wn = hits[0].face.normal
          .clone()
          .transformDirection(hits[0].object.matrixWorld)
          .normalize();
        // Random tilt ±15° for hand-applied feel.
        const rot = (rng() - 0.5) * (Math.PI / 6);
        placed = {
          position: point.toArray() as [number, number, number],
          normal: wn.toArray() as [number, number, number],
          rotation: rot,
          meshUUID: hits[0].object.uuid,
        };
      }
      if (placed) out.push(placed);
    }
    return out;
  }, [body, urls]);

  return (
    <>
      {placements.map((p, i) => (
        <StickerDecal
          key={`${i}-${urls[i]}`}
          body={body}
          url={urls[i]}
          position={p.position}
          normal={p.normal}
          rotation={p.rotation}
        />
      ))}
    </>
  );
}

function Scene({ stamps }: { stamps: string[] }) {
  const [body, setBody] = useState<THREE.Mesh | null>(null);
  const urls = useMemo(
    () =>
      stamps
        .slice(0, MAX_STICKERS)
        .map((name) => stampUrlFor(name))
        .filter((u): u is string => !!u),
    [stamps],
  );

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <Environment preset="studio" />
      <NormalizedSuitcase onBodyReady={setBody} />
      {body && <StickerLayer body={body} urls={urls} />}
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        // Polar locked above the equator → camera looks down at the bag,
        // which pushes the bag into the lower portion of the canvas so it
        // sits close to the pedestal below for a floating-on vibe.
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 2.6}
        rotateSpeed={0.8}
      />
    </>
  );
}

export function BagModel3D({
  onClick,
  size = DEFAULT_SIZE,
  stamps = [],
}: BagModel3DProps) {
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative ${interactive ? 'cursor-pointer' : ''}`}
      style={{
        width: size,
        height: size,
        // Pull the pedestal up under the bag's wheels — without this the
        // canvas's empty bottom pixels create a visible "floating" gap.
        // The CTA + dock below shift up by the same amount, so the rest of
        // the layout's spacing stays intact.
        marginBottom: -55,
        background: 'transparent',
        // Hand touch drags to OrbitControls instead of the page swipe gesture.
        touchAction: 'none',
      }}
      aria-label="Stamp bag"
    >
      <Canvas
        camera={{ position: [0, 1.85, 3], fov: 35 }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene stamps={stamps} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL as string);
