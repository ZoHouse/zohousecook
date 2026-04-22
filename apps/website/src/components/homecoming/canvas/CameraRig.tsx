import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScrollProgress } from "../ScrollRail";
import { BEATS } from "../../../lib/homecoming/beatTimeline";
import * as THREE from "three";

const POSES: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [ 0, 1.6, 12], look: [0, 1.6, 0] },
  { pos: [ 0, 1.6,  6], look: [0, 1.6, 0] },
  { pos: [ 0, 1.6,  5], look: [0, 1.2, 0] },
  { pos: [-1, 1.5,  4.5], look: [-2.4, 1.4, -1] },
  { pos: [ 0, 1.5,  5], look: [0, 1.4, -1] },
  { pos: [ 0, 1.5,  5.5], look: [0, 1.4, -1] },
  { pos: [ 0, 1.5,  6], look: [0, 1.5, -1] },
  { pos: [ 0, 1.6,  3.5], look: [0, 1.6, 0] },
];

export function CameraRig() {
  const { progress } = useScrollProgress();
  const { camera } = useThree();
  const target = React.useRef(new THREE.Vector3(0, 1.6, 0));

  useFrame(({ clock }) => {
    const scaled = progress * (BEATS.length - 1);
    const i = Math.max(0, Math.min(BEATS.length - 2, Math.floor(scaled)));
    const t = scaled - i;
    const a = POSES[i];
    const b = POSES[i + 1];

    const breath = Math.sin(clock.elapsedTime * Math.PI * 1.0) * 0.04;

    camera.position.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], t) + breath,
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
    );

    target.current.set(
      THREE.MathUtils.lerp(a.look[0], b.look[0], t),
      THREE.MathUtils.lerp(a.look[1], b.look[1], t),
      THREE.MathUtils.lerp(a.look[2], b.look[2], t),
    );
    camera.lookAt(target.current);
  });

  return null;
}
