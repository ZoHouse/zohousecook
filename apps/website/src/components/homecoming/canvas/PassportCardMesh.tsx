import React, { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PassportCardFace } from "./PassportCardFace";
import type { HomecomingPayload } from "../types";

interface Props {
  payload: HomecomingPayload;
  visible: boolean;
  onTap: () => void;
}

export function PassportCardMesh({ payload, visible, onTap }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.12;
  });

  if (!visible) return null;
  return (
    <group ref={groupRef} position={[0, 1.6, 0]}>
      <Html center occlude={false} style={{ pointerEvents: "auto" }}>
        <button
          onClick={onTap}
          style={{ all: "unset", cursor: "pointer" }}
          aria-label="Take your passport"
        >
          <PassportCardFace payload={payload} />
        </button>
      </Html>
    </group>
  );
}
