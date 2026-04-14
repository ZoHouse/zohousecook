import { useRef, useState, useMemo, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BlurFade } from "./helpers/house/BlurFade";
import type { Resident } from "../lib/residents";

const BLR_CAPACITY = 15;
const WTF_CAPACITY = 20;

interface PlotData {
  position: [number, number, number];
  resident?: Resident;
  isEmpty?: boolean;
  scale?: number;
  rotation?: number;
}

const jitter = (i: number, salt: number) =>
  (((i * 1103515245 + salt * 12345) % 1000) / 1000 - 0.5) * 0.35;

// Plot grid parameters.
const COL_SPACING = 1.5; // was 1.0 — houses were overlapping
const ROW_SPACING = 1.6; // was 1.5
const BLR_COLS = 5;
const WTF_COLS = 5;
const BLR_CENTER_X = -7.5;
const WTF_CENTER_X = 7.5;

function buildPlots(blr: Resident[], wtf: Resident[]): PlotData[] {
  const blrRows = Math.ceil(BLR_CAPACITY / BLR_COLS);
  const wtfRows = Math.ceil(WTF_CAPACITY / WTF_COLS);
  const blrStartX = BLR_CENTER_X - ((BLR_COLS - 1) * COL_SPACING) / 2;
  const wtfStartX = WTF_CENTER_X - ((WTF_COLS - 1) * COL_SPACING) / 2;
  const blrStartZ = -((blrRows - 1) * ROW_SPACING) / 2;
  const wtfStartZ = -((wtfRows - 1) * ROW_SPACING) / 2;

  const blrPlots = Array.from({ length: BLR_CAPACITY }, (_, i) => {
    const row = Math.floor(i / BLR_COLS);
    const col = i % BLR_COLS;
    const x = blrStartX + col * COL_SPACING + jitter(i, 1);
    const z = blrStartZ + row * ROW_SPACING + jitter(i, 2);
    const resident = blr[i];
    return {
      position: [x, 0, z] as [number, number, number],
      resident,
      isEmpty: !resident,
      scale: (resident ? 0.9 : 0.7) + jitter(i, 3) * 0.3,
      rotation: jitter(i, 4) * 2,
    };
  });
  const wtfPlots = Array.from({ length: WTF_CAPACITY }, (_, i) => {
    const row = Math.floor(i / WTF_COLS);
    const col = i % WTF_COLS;
    const x = wtfStartX + col * COL_SPACING + jitter(i + 100, 1);
    const z = wtfStartZ + row * ROW_SPACING + jitter(i + 100, 2);
    const resident = wtf[i];
    return {
      position: [x, 0, z] as [number, number, number],
      resident,
      isEmpty: !resident,
      scale: (resident ? 0.9 : 0.7) + jitter(i + 100, 3) * 0.3,
      rotation: jitter(i + 100, 4) * 2,
    };
  });
  return [...blrPlots, ...wtfPlots];
}

// Trees — placed around each island's outer ring + a few between clusters.
type TreeSpec = { pos: [number, number, number]; scale: number; type: number };

function treesAroundIsland(
  centerX: number,
  innerR: number,
  count: number,
  salt: number
): TreeSpec[] {
  const trees: TreeSpec[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + jitter(i + salt, 1) * 0.4;
    const r = innerR + 0.4 + Math.abs(jitter(i + salt, 2)) * 1.2;
    trees.push({
      pos: [
        centerX + Math.cos(angle) * r,
        0,
        Math.sin(angle) * r,
      ],
      scale: 0.7 + Math.abs(jitter(i + salt, 3)) * 0.8,
      type: i % 3,
    });
  }
  return trees;
}

const treePositions: TreeSpec[] = [
  ...treesAroundIsland(-7.5, 5.5, 14, 11),
  ...treesAroundIsland(7.5, 6.2, 16, 23),
  // A few between the clusters
  { pos: [0, 0, -2.5], scale: 1.0, type: 0 },
  { pos: [0, 0, 2.5], scale: 0.9, type: 1 },
  { pos: [-1.5, 0, 0.5], scale: 0.7, type: 2 },
  { pos: [1.5, 0, 0.5], scale: 0.7, type: 2 },
];

const streetLightPositions: [number, number, number][] = [
  [-9, 0, -0.5], [-6, 0, 0.5],
  [-7.5, 0, -2.2], [-7.5, 0, 2.2],
  [6, 0, -1.5], [9, 0, 1],
  [6, 0, 1.5], [9, 0, -0.5],
  [-1, 0, 0], [1, 0, -0.5],
];

// Shared materials
const matTrunk = new THREE.MeshStandardMaterial({ color: "#5a3f24", roughness: 0.9 });
const matCanopy = new THREE.MeshStandardMaterial({ color: "#3d6e32", roughness: 0.8 });
const matCanopyHighlight = new THREE.MeshStandardMaterial({ color: "#4f8a3d", roughness: 0.75, transparent: true, opacity: 0.85 });
const matPine1 = new THREE.MeshStandardMaterial({ color: "#335b28", roughness: 0.8 });
const matPine2 = new THREE.MeshStandardMaterial({ color: "#407035", roughness: 0.8 });
const matBush1 = new THREE.MeshStandardMaterial({ color: "#38582a", roughness: 0.85 });
const matBush2 = new THREE.MeshStandardMaterial({ color: "#466b34", roughness: 0.85 });
const matStone = new THREE.MeshStandardMaterial({ color: "#524d44", roughness: 0.9 });
const matWood = new THREE.MeshStandardMaterial({ color: "#7d5830", roughness: 0.8 });
const matRoof = new THREE.MeshStandardMaterial({ color: "#5c341d", roughness: 0.8, metalness: 0.1 });
const matPole = new THREE.MeshStandardMaterial({ color: "#3a3020", metalness: 0.6, roughness: 0.4 });
const matLanternBox = new THREE.MeshStandardMaterial({ color: "#2a2015", metalness: 0.5, roughness: 0.5 });
const matLanternGlow = new THREE.MeshStandardMaterial({ color: "#ffc040", emissive: "#ffc040", emissiveIntensity: 12 });
const matPath = new THREE.MeshStandardMaterial({ color: "#1e1a12", roughness: 0.85 });
const matPathEdge = new THREE.MeshStandardMaterial({ color: "#151210", roughness: 0.9, transparent: true, opacity: 0.5 });
const matGround = new THREE.MeshStandardMaterial({ color: "#161412", roughness: 0.95 });
const matIsland = new THREE.MeshStandardMaterial({ color: "#28221b", roughness: 0.9 });
const matGrass = new THREE.MeshStandardMaterial({ color: "#2c3f1c", roughness: 0.9, transparent: true, opacity: 0.7 });
const matGroundGlow = new THREE.MeshStandardMaterial({ color: "#ffa830", transparent: true, opacity: 0.2 });
const matDoor = new THREE.MeshStandardMaterial({ color: "#d4a030", emissive: "#d4a030", emissiveIntensity: 2.0 });

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

const geoSmallSphere = new THREE.SphereGeometry(1, 6, 5);
const geoCone = new THREE.ConeGeometry(1, 1, 4);
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoPlane = new THREE.PlaneGeometry(1, 1);
const geoCylinder = new THREE.CylinderGeometry(1, 1, 1, 5);
const geoRing = new THREE.RingGeometry(0.25, 0.32, 12);
const geoCircle = new THREE.CircleGeometry(0.5, 10);
const geoLanternBulb = new THREE.SphereGeometry(0.025, 4, 4);

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
              href="/?apply=1"
              className="block bg-[#0e0e0c]/95 backdrop-blur-xl border border-[#d4af37]/30 rounded-lg px-4 py-2.5 whitespace-nowrap shadow-2xl cursor-pointer hover:border-[#d4af37]/60 transition-colors"
            >
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#d4af37]">
                Claim your slot →
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
      <mesh position={[0, 0.05, 0]} scale={[0.7 * s, 0.1, 0.6 * s]} material={matStone} geometry={geoBox} />
      <mesh position={[0, 0.35 * s, 0]} scale={[0.6 * s, 0.5 * s, 0.5 * s]} material={matWood} geometry={geoBox} />
      <mesh position={[0, 0.7 * s, 0]} rotation={[0, Math.PI / 4, 0]} scale={[0.5 * s, 0.35 * s, 0.5 * s]} material={matRoof} geometry={geoCone} />
      <mesh position={[0.15 * s, 0.85 * s, -0.1 * s]} scale={[0.08 * s, 0.25 * s, 0.08 * s]} material={matStone} geometry={geoBox} />
      <mesh position={[0, 0.35 * s, 0.26 * s]} scale={[0.12 * s, 0.15 * s, 1]} material={isHovered ? matWindowFrontHover : matWindowFront} geometry={geoPlane} />
      <mesh position={[0.31 * s, 0.35 * s, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.1 * s, 0.12 * s, 1]} material={isHovered ? matWindowSideHover : matWindowSide} geometry={geoPlane} />
      <mesh position={[0, 0.35 * s, -0.26 * s]} rotation={[0, Math.PI, 0]} scale={[0.1 * s, 0.12 * s, 1]} material={isHovered ? matWindowBackHover : matWindowBack} geometry={geoPlane} />
      <mesh position={[-0.12 * s, 0.18 * s, 0.26 * s]} scale={[0.1 * s, 0.22 * s, 1]} material={matDoor} geometry={geoPlane} />

      {isHovered && plot.resident && (
        <Html position={[0, 1.5 * s, 0]} center style={{ pointerEvents: "none" }}>
          <div className="bg-[#0e0e0c]/95 backdrop-blur-xl border border-[#d4af37]/20 rounded-2xl px-6 py-5 min-w-[240px] shadow-2xl shadow-black/80 whitespace-nowrap">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4af37]/40 flex-shrink-0 bg-white/5 flex items-center justify-center">
                <span className="text-[#d4af37] text-lg font-bold">
                  {plot.resident.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white text-base font-bold leading-tight">
                  {plot.resident.name}
                </p>
                <p className="text-[#d4af37]/60 text-[11px] font-bold tracking-[0.15em] uppercase mt-1">
                  {plot.resident.property === "BLRxZo" ? "Koramangala" : "Whitefield"}
                </p>
              </div>
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

function StaticCamera() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function VillageScene({ plots }: { plots: PlotData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const handleHover = useCallback((i: number) => setHoveredIndex(i), []);
  const handleUnhover = useCallback(() => setHoveredIndex(null), []);

  return (
    <>
      <ambientLight intensity={0.55} color="#9baac0" />
      <directionalLight position={[5, 14, -3]} intensity={0.4} color="#b8c8e0" />
      <hemisphereLight color="#3a4a70" groundColor="#2a1a12" intensity={0.5} />
      <pointLight position={[BLR_CENTER_X, 3, 0]} color="#ffb040" intensity={45} distance={18} decay={2} />
      <pointLight position={[WTF_CENTER_X, 3, 0]} color="#ffb040" intensity={45} distance={18} decay={2} />
      <directionalLight position={[3, 20, -5]} intensity={0.4} color="#dce6ff" />
      <fog attach="fog" args={["#0a0a12", 20, 40]} />

      <StaticCamera />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} material={matGround}>
        <planeGeometry args={[40, 40]} />
      </mesh>

      <Island position={[BLR_CENTER_X, 0.01, 0]} radius={5.5} />
      <Island position={[WTF_CENTER_X, 0.01, 0]} radius={6.2} />

      <Html position={[BLR_CENTER_X, 5.5, 0]} center style={{ pointerEvents: "none", zIndex: 0 }}>
        <div className="text-center whitespace-nowrap opacity-70">
          <p className="text-white text-sm md:text-base font-bold tracking-tight">BLRxZo</p>
          <p className="text-[#d4af37] text-[9px] font-bold tracking-[0.15em] uppercase">Koramangala</p>
        </div>
      </Html>
      <Html position={[WTF_CENTER_X, 5.5, 0]} center style={{ pointerEvents: "none", zIndex: 0 }}>
        <div className="text-center whitespace-nowrap opacity-70">
          <p className="text-white text-sm md:text-base font-bold tracking-tight">WTFxZo</p>
          <p className="text-[#d4af37] text-[9px] font-bold tracking-[0.15em] uppercase">Whitefield</p>
        </div>
      </Html>

      {streetLightPositions.map((pos, i) => (
        <StreetLight key={`sl-${i}`} position={pos} />
      ))}

      {treePositions.map((t, i) => (
        <VillageTree key={`t-${i}`} position={t.pos} scale={t.scale} type={t.type} />
      ))}

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

interface VillageProps {
  blr?: Resident[];
  wtf?: Resident[];
  syncedAt?: string | null;
}

export function Village({ blr = [], wtf = [], syncedAt = null }: VillageProps) {
  const plots = useMemo(() => buildPlots(blr, wtf), [blr, wtf]);
  const blrConfirmed = blr.length;
  const wtfConfirmed = wtf.length;
  const plotsRemaining = BLR_CAPACITY + WTF_CAPACITY - blrConfirmed - wtfConfirmed;

  return (
    <section className="relative h-[200vh] bg-[#050508]">
      <div className="sticky top-0 z-10 w-full h-screen flex flex-col px-4 md:px-8 py-10 overflow-hidden">
        <BlurFade inView delay={0.1} direction="up">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase block mb-4">
              The Village · Live
            </span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
              Already inside the{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                civilisation.
              </span>
            </h2>
            <p className="text-neutral-400 text-base font-light max-w-lg mx-auto">
              Each glowing house is a real founder, right now. Hover to see who&apos;s building.
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
              <VillageScene plots={plots} />
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
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {blrConfirmed}
                <span className="text-neutral-500 font-light">/{BLR_CAPACITY}</span>
              </p>
              <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mt-1">BLRxZo residents</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {wtfConfirmed}
                <span className="text-neutral-500 font-light">/{WTF_CAPACITY}</span>
              </p>
              <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mt-1">WTFxZo residents</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-xl md:text-2xl font-bold shiny-gold tracking-tight">{plotsRemaining}</p>
              <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mt-1">Slots remaining</p>
            </div>
          </div>
          {syncedAt && (
            <p className="text-[9px] text-neutral-600 text-center mt-2 font-mono">
              synced {new Date(syncedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
            </p>
          )}
        </BlurFade>
      </div>
    </section>
  );
}
