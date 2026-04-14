import { useRef, useState, useMemo, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BlurFade } from "./ui/BlurFade";

// ─── Data ───────────────────────────────────────────────────────────────

interface Founder {
  name: string;
  building: string;
  link: string;
  avatar: string;
}

// ── BLRxZo — Koramangala ──
const blrFounders: Founder[] = [
  { name: "Tejas Agrawal", building: "Stealth", link: "x.com/PossiblyTejas", avatar: "https://unavatar.io/x/PossiblyTejas" },
  { name: "Manan Gupta", building: "Artemis App", link: "x.com/yoitsmanan", avatar: "https://unavatar.io/x/yoitsmanan" },
  { name: "Savio Martin", building: "Simpleclaw", link: "x.com/saviomartin7", avatar: "https://avatars.githubusercontent.com/u/61895712?s=200" },
  { name: "Harish Ashok", building: "Stealth", link: "x.com/habril27", avatar: "https://unavatar.io/x/habril27" },
  { name: "Yuvraj Aaditya", building: "TheResidency BLR", link: "x.com/AadityaYuvraj", avatar: "https://unavatar.io/x/AadityaYuvraj" },
  { name: "Subh", building: "Stealth", link: "instagram.com/shubhxho", avatar: "https://unavatar.io/instagram/shubhxho" },
  { name: "Shlok", building: "PolyHedge", link: "x.com/shlokm289", avatar: "https://unavatar.io/x/shlokm289" },
];

// ── WTFxZo — Whitefield ──
const wtfFounders: Founder[] = [
  { name: "Pratham", building: "MentiBus", link: "x.com/prathadox", avatar: "https://unavatar.io/x/prathadox" },
  { name: "Jacky", building: "TBD", link: "", avatar: "/pfp3.webp" },
];

interface PlotData {
  position: [number, number, number];
  founder?: Founder;
  isEmpty?: boolean;
  scale?: number;
  rotation?: number;
}

const plots: PlotData[] = [
  // ── BLRxZo — Koramangala (left cluster) ──
  { position: [-5.5, 0, -1.5], founder: blrFounders[0], scale: 0.95, rotation: 0.2 },
  { position: [-4.2, 0, -0.3], founder: blrFounders[1], scale: 1.0, rotation: -0.3 },
  { position: [-6.5, 0, 0], founder: blrFounders[2], scale: 0.9, rotation: 0.5 },
  { position: [-5, 0, 1], founder: blrFounders[3], scale: 0.85, rotation: 0.1 },
  { position: [-3.5, 0, -1], founder: blrFounders[4], scale: 0.9, rotation: -0.4 },
  { position: [-6.2, 0, -1.2], founder: blrFounders[5], scale: 0.85, rotation: 0.7 },
  { position: [-4.5, 0, 1.5], founder: blrFounders[6], scale: 0.95, rotation: -0.2 },
  // Empty plots — BLR
  { position: [-3, 0, 0.5], isEmpty: true, scale: 0.7 },
  { position: [-7, 0, 1.2], isEmpty: true, scale: 0.7 },

  // ── WTFxZo — Whitefield (right cluster) ──
  { position: [5, 0, -0.5], founder: wtfFounders[0], scale: 1.0, rotation: -0.2 },
  { position: [6.2, 0, 0.5], founder: wtfFounders[1], scale: 0.95, rotation: 0.4 },
  // Empty plots — WTF
  { position: [4.2, 0, 0.8], isEmpty: true, scale: 0.7 },
  { position: [6.8, 0, -1], isEmpty: true, scale: 0.7 },
  { position: [5.5, 0, -1.8], isEmpty: true, scale: 0.7 },
  { position: [7, 0, 0.8], isEmpty: true, scale: 0.7 },
  { position: [4.5, 0, -1.5], isEmpty: true, scale: 0.7 },
];

// Trees — around 2 clusters
const treePositions: { pos: [number, number, number]; scale: number; type: number }[] = [
  // BLR cluster surroundings
  { pos: [-8, 0, -2.5], scale: 1.2, type: 0 },
  { pos: [-8.5, 0, 0.5], scale: 0.8, type: 1 },
  { pos: [-3, 0, -2.5], scale: 1.0, type: 0 },
  { pos: [-7.5, 0, 2], scale: 0.9, type: 1 },
  { pos: [-2.5, 0, -0.5], scale: 0.7, type: 2 },
  { pos: [-8, 0, 1.5], scale: 1.1, type: 0 },
  { pos: [-7, 0, -2.8], scale: 1.0, type: 1 },
  { pos: [-9, 0, -1], scale: 1.3, type: 0 },
  { pos: [-3, 0, 2], scale: 0.75, type: 2 },
  // Between clusters
  { pos: [-1.5, 0, -1], scale: 1.1, type: 0 },
  { pos: [0, 0, 0.5], scale: 0.9, type: 1 },
  { pos: [1, 0, -1.5], scale: 0.8, type: 0 },
  { pos: [-0.5, 0, 1.5], scale: 0.7, type: 2 },
  { pos: [2, 0, 0.5], scale: 0.6, type: 2 },
  { pos: [0.5, 0, -2.5], scale: 0.95, type: 0 },
  // WTF cluster surroundings
  { pos: [8, 0, -2], scale: 1.0, type: 0 },
  { pos: [8.5, 0, 1], scale: 0.9, type: 1 },
  { pos: [3.5, 0, -2.5], scale: 1.2, type: 0 },
  { pos: [7.5, 0, 2], scale: 0.8, type: 1 },
  { pos: [8.5, 0, 2], scale: 0.7, type: 2 },
  { pos: [9, 0, -0.5], scale: 1.1, type: 0 },
  { pos: [3.5, 0, 2], scale: 0.65, type: 2 },
  // Far edges
  { pos: [-10, 0, -3], scale: 1.4, type: 0 },
  { pos: [10, 0, -3], scale: 1.3, type: 0 },
  { pos: [-10, 0, 2], scale: 1.2, type: 1 },
  { pos: [10, 0, 2], scale: 1.1, type: 1 },
  { pos: [0, 0, 3.5], scale: 1.0, type: 0 },
  { pos: [-10.5, 0, 0], scale: 1.3, type: 0 },
  { pos: [10.5, 0, 0], scale: 1.2, type: 0 },
  { pos: [0, 0, -3.5], scale: 1.1, type: 0 },
];

// Street light positions
const streetLightPositions: [number, number, number][] = [
  [-4, 0, -0.5], [-6, 0, 0.5],
  [-5, 0, -2], [-3.5, 0, 1.5],
  [5, 0, -1.5], [6.5, 0, 1],
  [4.5, 0, 1.5], [7, 0, -0.5],
  [-1, 0, 0], [1, 0, -0.5],
];

// ─── Shared materials (reuse instead of creating per-mesh) ─────────────

const matTrunk = new THREE.MeshStandardMaterial({ color: "#2a1e10", roughness: 0.9 });
const matCanopy = new THREE.MeshStandardMaterial({ color: "#1a3518", roughness: 0.8 });
const matCanopyHighlight = new THREE.MeshStandardMaterial({ color: "#224020", roughness: 0.75, transparent: true, opacity: 0.7 });
const matPine1 = new THREE.MeshStandardMaterial({ color: "#152a12", roughness: 0.8 });
const matPine2 = new THREE.MeshStandardMaterial({ color: "#1e3518", roughness: 0.8 });
const matBush1 = new THREE.MeshStandardMaterial({ color: "#182a14", roughness: 0.85 });
const matBush2 = new THREE.MeshStandardMaterial({ color: "#203218", roughness: 0.85 });
const matStone = new THREE.MeshStandardMaterial({ color: "#252420", roughness: 0.9 });
const matWood = new THREE.MeshStandardMaterial({ color: "#3a2a18", roughness: 0.8 });
const matRoof = new THREE.MeshStandardMaterial({ color: "#2a1a10", roughness: 0.8, metalness: 0.1 });
const matPole = new THREE.MeshStandardMaterial({ color: "#3a3020", metalness: 0.6, roughness: 0.4 });
const matLanternBox = new THREE.MeshStandardMaterial({ color: "#2a2015", metalness: 0.5, roughness: 0.5 });
const matLanternGlow = new THREE.MeshStandardMaterial({ color: "#ffc040", emissive: "#ffc040", emissiveIntensity: 12 });
const matPath = new THREE.MeshStandardMaterial({ color: "#1e1a12", roughness: 0.85 });
const matPathEdge = new THREE.MeshStandardMaterial({ color: "#151210", roughness: 0.9, transparent: true, opacity: 0.5 });
const matGround = new THREE.MeshStandardMaterial({ color: "#080808", roughness: 0.95 });
const matIsland = new THREE.MeshStandardMaterial({ color: "#121010", roughness: 0.9 });
const matGrass = new THREE.MeshStandardMaterial({ color: "#152010", roughness: 0.9, transparent: true, opacity: 0.5 });
const matGroundGlow = new THREE.MeshStandardMaterial({ color: "#ffa830", transparent: true, opacity: 0.2 });
const matDoor = new THREE.MeshStandardMaterial({ color: "#d4a030", emissive: "#d4a030", emissiveIntensity: 2.0 });

// Window materials — intense warm glow against dark night
const matWindowFront = new THREE.MeshStandardMaterial({ color: "#ffc040", emissive: "#ffc040", emissiveIntensity: 10, transparent: true, opacity: 0.95 });
const matWindowSide = new THREE.MeshStandardMaterial({ color: "#ffc040", emissive: "#ffc040", emissiveIntensity: 8, transparent: true, opacity: 0.9 });
const matWindowBack = new THREE.MeshStandardMaterial({ color: "#ffc040", emissive: "#ffc040", emissiveIntensity: 6, transparent: true, opacity: 0.85 });
const matWindowFrontHover = new THREE.MeshStandardMaterial({ color: "#ffe080", emissive: "#ffe080", emissiveIntensity: 15, transparent: true, opacity: 1.0 });
const matWindowSideHover = new THREE.MeshStandardMaterial({ color: "#ffe080", emissive: "#ffe080", emissiveIntensity: 12, transparent: true, opacity: 0.95 });
const matWindowBackHover = new THREE.MeshStandardMaterial({ color: "#ffe080", emissive: "#ffe080", emissiveIntensity: 10, transparent: true, opacity: 0.9 });

const matPlotRing = new THREE.MeshStandardMaterial({ color: "#555", transparent: true, opacity: 0.4 });
const matPlotRingHover = new THREE.MeshStandardMaterial({ color: "#ffd060", emissive: "#ffd060", emissiveIntensity: 1.0, transparent: true, opacity: 0.9 });
const matPlotPlus = new THREE.MeshStandardMaterial({ color: "#666", transparent: true, opacity: 0.6 });
const matPlotPlusHover = new THREE.MeshStandardMaterial({ color: "#ffd060", transparent: true, opacity: 0.7 });

// ─── Shared geometries ─────────────────────────────────────────────────

const geoSmallSphere = new THREE.SphereGeometry(1, 6, 5);
const geoCone = new THREE.ConeGeometry(1, 1, 4);
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoPlane = new THREE.PlaneGeometry(1, 1);
const geoCylinder = new THREE.CylinderGeometry(1, 1, 1, 5);
const geoRing = new THREE.RingGeometry(0.25, 0.32, 12);
const geoCircle = new THREE.CircleGeometry(0.5, 10);
const geoLanternBulb = new THREE.SphereGeometry(0.025, 4, 4);

// ─── 3D Components ──────────────────────────────────────────────────────

function StreetLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} scale={[0.025, 0.7, 0.025]} material={matPole} geometry={geoCylinder} />
      <mesh position={[0.08, 0.68, 0]} rotation={[0, 0, Math.PI / 6]} scale={[0.015, 0.18, 0.015]} material={matPole} geometry={geoCylinder} />
      <mesh position={[0.14, 0.72, 0]} scale={[0.06, 0.08, 0.06]} material={matLanternBox} geometry={geoBox} />
      <mesh position={[0.14, 0.72, 0]} material={matLanternGlow} geometry={geoLanternBulb} />
      <mesh position={[0.05, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={matGroundGlow} geometry={geoCircle} />
    </group>
  );
}

function VillageTree({ position, scale, type }: { position: [number, number, number]; scale: number; type: number }) {
  const trunkHeight = 0.3 * scale;
  const canopySize = type === 1 ? 0.4 * scale : 0.5 * scale;

  return (
    <group position={position}>
      <mesh position={[0, trunkHeight / 2, 0]} scale={[0.04 * scale, trunkHeight, 0.04 * scale]} material={matTrunk} geometry={geoCylinder} />
      {type === 0 ? (
        <>
          <mesh position={[0, trunkHeight + canopySize * 0.6, 0]} scale={[canopySize, canopySize, canopySize]} material={matCanopy} geometry={geoSmallSphere} />
          <mesh position={[0, trunkHeight + canopySize * 0.8, 0]} scale={[canopySize * 0.7, canopySize * 0.7, canopySize * 0.7]} material={matCanopyHighlight} geometry={geoSmallSphere} />
        </>
      ) : type === 1 ? (
        <>
          <mesh position={[0, trunkHeight + 0.15, 0]} scale={[canopySize * 0.8, canopySize * 1.6, canopySize * 0.8]} material={matPine1} geometry={geoCone} />
          <mesh position={[0, trunkHeight + canopySize * 1.2, 0]} scale={[canopySize * 0.5, canopySize, canopySize * 0.5]} material={matPine2} geometry={geoCone} />
        </>
      ) : (
        <>
          <mesh position={[0, 0.12 * scale, 0]} scale={[0.2 * scale, 0.2 * scale, 0.2 * scale]} material={matBush1} geometry={geoSmallSphere} />
          <mesh position={[0.08 * scale, 0.1 * scale, 0.05 * scale]} scale={[0.14 * scale, 0.14 * scale, 0.14 * scale]} material={matBush2} geometry={geoSmallSphere} />
        </>
      )}
    </group>
  );
}

function HouseModel({
  plot,
  onHover,
  onUnhover,
  isHovered,
}: {
  plot: PlotData;
  onHover: () => void;
  onUnhover: () => void;
  isHovered: boolean;
}) {
  const s = plot.scale || 1;

  if (plot.isEmpty) {
    return (
      <group position={plot.position}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
          onPointerEnter={(e) => { e.stopPropagation(); onHover(); }}
          onPointerLeave={onUnhover}
          material={isHovered ? matPlotRingHover : matPlotRing}
          geometry={geoRing}
        />
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.02, 0.2, 1]} material={isHovered ? matPlotPlusHover : matPlotPlus} geometry={geoPlane} />
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={[0.02, 0.2, 1]} material={isHovered ? matPlotPlusHover : matPlotPlus} geometry={geoPlane} />
        {isHovered && (
          <Html position={[0, 0.8, 0]} center>
            <a
              href="/house/apply"
              className="block bg-[#0e0e0c]/95 backdrop-blur-xl border border-[#d4af37]/30 rounded-lg px-4 py-2.5 whitespace-nowrap shadow-2xl cursor-pointer hover:border-[#d4af37]/60 transition-colors"
            >
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#d4af37]">
                Claim your plot →
              </span>
            </a>
          </Html>
        )}
      </group>
    );
  }

  return (
    <group
      position={plot.position}
      rotation={[0, plot.rotation || 0, 0]}
      onPointerEnter={(e) => { e.stopPropagation(); onHover(); }}
      onPointerLeave={onUnhover}
    >
      {/* Foundation */}
      <mesh position={[0, 0.05, 0]} scale={[0.7 * s, 0.1, 0.6 * s]} material={matStone} geometry={geoBox} />
      {/* Walls */}
      <mesh position={[0, 0.35 * s, 0]} scale={[0.6 * s, 0.5 * s, 0.5 * s]} material={matWood} geometry={geoBox} />
      {/* Roof */}
      <mesh position={[0, 0.7 * s, 0]} rotation={[0, Math.PI / 4, 0]} scale={[0.5 * s, 0.35 * s, 0.5 * s]} material={matRoof} geometry={geoCone} />
      {/* Chimney */}
      <mesh position={[0.15 * s, 0.85 * s, -0.1 * s]} scale={[0.08 * s, 0.25 * s, 0.08 * s]} material={matStone} geometry={geoBox} />

      {/* Windows */}
      <mesh position={[0, 0.35 * s, 0.26 * s]} scale={[0.12 * s, 0.15 * s, 1]} material={isHovered ? matWindowFrontHover : matWindowFront} geometry={geoPlane} />
      <mesh position={[0.31 * s, 0.35 * s, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.1 * s, 0.12 * s, 1]} material={isHovered ? matWindowSideHover : matWindowSide} geometry={geoPlane} />
      <mesh position={[0, 0.35 * s, -0.26 * s]} rotation={[0, Math.PI, 0]} scale={[0.1 * s, 0.12 * s, 1]} material={isHovered ? matWindowBackHover : matWindowBack} geometry={geoPlane} />
      {/* Door */}
      <mesh position={[-0.12 * s, 0.18 * s, 0.26 * s]} scale={[0.1 * s, 0.22 * s, 1]} material={matDoor} geometry={geoPlane} />

      {/* Hover tooltip */}
      {isHovered && plot.founder && (
        <Html position={[0, 1.5 * s, 0]} center style={{ pointerEvents: "none" }}>
          <div className="bg-[#0e0e0c]/95 backdrop-blur-xl border border-[#d4af37]/20 rounded-2xl px-6 py-5 min-w-[260px] shadow-2xl shadow-black/80 whitespace-nowrap">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#d4af37]/40 flex-shrink-0">
                <img
                  src={plot.founder.avatar}
                  alt={plot.founder.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-white text-base font-bold leading-tight">
                  {plot.founder.name}
                </p>
                <p className="text-[#d4af37]/60 text-[11px] font-bold tracking-[0.15em] uppercase mt-1">
                  Resident
                </p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3 mt-2">
              <p className="text-neutral-300 text-sm">
                Building{" "}
                <span className="text-[#d4af37] font-semibold">
                  {plot.founder.building}
                </span>
              </p>
              {plot.founder.link && (
                <p className="text-neutral-500 text-xs mt-2">
                  {plot.founder.link}
                </p>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Island({ position, radius }: { position: [number, number, number]; radius: number }) {
  const circleGeo = useMemo(() => new THREE.CircleGeometry(radius, 24), [radius]);
  const ringGeo = useMemo(() => new THREE.RingGeometry(radius - 0.3, radius + 0.15, 24), [radius]);
  return (
    <group>
      <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={matIsland} geometry={circleGeo} />
      <mesh position={[position[0], position[1] - 0.001, position[2]]} rotation={[-Math.PI / 2, 0, 0]} material={matGrass} geometry={ringGeo} />
    </group>
  );
}

function Path({ points, width = 0.18 }: { points: [number, number, number][]; width?: number }) {
  const tubeGeom = useMemo(() => {
    const pts = points.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 24, width, 5, false);
  }, [points, width]);

  const edgeGeom = useMemo(() => {
    const pts = points.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 24, width + 0.06, 5, false);
  }, [points, width]);

  return (
    <group>
      <mesh geometry={tubeGeom} material={matPath} />
      <mesh geometry={edgeGeom} material={matPathEdge} />
    </group>
  );
}

// Static camera — no rotation
function StaticCamera() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, 12, 14);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Scene ──────────────────────────────────────────────────────────────

function VillageScene() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleHover = useCallback((i: number) => setHoveredIndex(i), []);
  const handleUnhover = useCallback(() => setHoveredIndex(null), []);

  return (
    <>
      {/* Night lighting — dark ambient, warm point lights */}
      <ambientLight intensity={0.15} color="#8090b0" />
      <directionalLight position={[5, 14, -3]} intensity={0.1} color="#a0b0d0" />
      <hemisphereLight color="#1a2040" groundColor="#0a0806" intensity={0.15} />

      {/* Warm cluster glow from houses */}
      <pointLight position={[-5, 2, 0]} color="#ffa830" intensity={15} distance={8} decay={2} />
      <pointLight position={[5.5, 2, 0]} color="#ffa830" intensity={15} distance={8} decay={2} />
      {/* Subtle moonlight */}
      <directionalLight position={[3, 20, -5]} intensity={0.2} color="#c0d0ff" />

      <fog attach="fog" args={["#050508", 14, 28]} />

      <StaticCamera />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} material={matGround}>
        <planeGeometry args={[40, 40]} />
      </mesh>

      {/* Two islands */}
      <Island position={[-5, 0.01, 0]} radius={4} />
      <Island position={[5.5, 0.01, 0]} radius={4} />

      {/* Cluster labels — high above houses so they don't overlap hover cards */}
      <Html position={[-5, 4.5, 0]} center style={{ pointerEvents: "none", zIndex: 0 }}>
        <div className="text-center whitespace-nowrap opacity-70">
          <p className="text-white text-sm md:text-base font-bold tracking-tight">BLRxZo</p>
          <p className="text-[#d4af37] text-[9px] font-bold tracking-[0.15em] uppercase">Koramangala</p>
        </div>
      </Html>
      <Html position={[5.5, 4.5, 0]} center style={{ pointerEvents: "none", zIndex: 0 }}>
        <div className="text-center whitespace-nowrap opacity-70">
          <p className="text-white text-sm md:text-base font-bold tracking-tight">WTFxZo</p>
          <p className="text-[#d4af37] text-[9px] font-bold tracking-[0.15em] uppercase">Whitefield</p>
        </div>
      </Html>

      {/* Paths — connecting the two clusters + internal paths */}
      <Path points={[[-3, 0.02, 0], [-1.5, 0.02, -0.3], [0, 0.02, -0.2], [1.5, 0.02, -0.3], [3, 0.02, 0]]} width={0.22} />
      <Path points={[[-6, 0.02, -1.5], [-5.5, 0.02, -0.5], [-5, 0.02, 0.5], [-4.5, 0.02, 1.2]]} width={0.12} />
      <Path points={[[4.5, 0.02, -1.5], [5, 0.02, -0.5], [5.5, 0.02, 0.5], [6, 0.02, 1]]} width={0.12} />

      {/* Street lights */}
      {streetLightPositions.map((pos, i) => (
        <StreetLight key={`sl-${i}`} position={pos} />
      ))}

      {/* Trees */}
      {treePositions.map((t, i) => (
        <VillageTree key={`t-${i}`} position={t.pos} scale={t.scale} type={t.type} />
      ))}

      {/* Houses */}
      {plots.map((plot, i) => (
        <HouseModel
          key={`h-${i}`}
          plot={plot}
          isHovered={hoveredIndex === i}
          onHover={() => handleHover(i)}
          onUnhover={handleUnhover}
        />
      ))}
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────

export function Village() {
  const occupiedCount = plots.filter((p) => p.founder).length;
  const emptyCount = plots.filter((p) => p.isEmpty).length;

  return (
    <section className="relative h-[200vh] bg-[#050508]">
      <div className="sticky top-0 z-10 w-full h-screen flex flex-col px-4 md:px-8 py-10 overflow-hidden">
        <BlurFade inView delay={0.1} direction="up">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase block mb-4">
              The Village
            </span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
              Already inside the{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                civilisation.
              </span>
            </h2>
            <p className="text-neutral-400 text-base font-light max-w-lg mx-auto">
              Each glowing house is a founder. Hover to see who&apos;s building
              what. The village keeps growing.
            </p>
          </div>
        </BlurFade>

        <div className="relative w-full flex-1 overflow-hidden border border-white/5 rounded-2xl">
          <Canvas
            camera={{ position: [0, 10, 14], fov: 40 }}
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            style={{ background: "#050508" }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <Suspense fallback={null}>
              <VillageScene />
            </Suspense>
          </Canvas>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050508] to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#050508] to-transparent" />
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#050508] to-transparent" />
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#050508] to-transparent" />
          </div>
        </div>

        <BlurFade inView delay={0.3} direction="up">
          <div className="mt-8 flex items-center justify-center gap-6 md:gap-10 text-center">
            <div>
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{blrFounders.length}</p>
              <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mt-1">BLRxZo confirmed</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{wtfFounders.length}</p>
              <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mt-1">WTFxZo confirmed</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-xl md:text-2xl font-bold shiny-gold tracking-tight">{emptyCount}</p>
              <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mt-1">Plots remaining</p>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
