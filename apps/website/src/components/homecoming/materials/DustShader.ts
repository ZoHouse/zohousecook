// apps/website/src/components/homecoming/materials/DustShader.ts
import { ShaderMaterial, Color, Vector2, NormalBlending, DoubleSide } from 'three'

export type DustMode = 'raymarch' | 'billboard'

/**
 * Volumetric Mars smoke. The shell is a sphere centered on the camera; the
 * fragment shader runs a domain-warped fbm (inspired by samurai-fx Heatmap +
 * Dune presets) and color-ramps it through a Mars palette. Scroll vector
 * points upward (in UV space) so the smoke reads as rising.
 *
 * Density is attenuated by:
 *   - y-range envelope: only active across the descent zone (y ≈ -5 to -95),
 *     rises during u ≈ 0.08–0.16 as the camera tilts into the dust
 *   - near/far camera fade: preserves a readable window around the camera so
 *     proof cards don't get painted over while still building mid-distance haze
 */
export function createDustShader(mode: DustMode): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      // Mars smoke palette — dark charred through ember through warm cream.
      uColorA: { value: new Color(0x120603) },   // deep char
      uColorB: { value: new Color(0x4a1a0c) },   // mars rust
      uColorC: { value: new Color(0xbe4e1d) },   // burning ember
      uColorD: { value: new Color(0xf1a46d) },   // warm sandstone
      uDensity: { value: mode === 'raymarch' ? 0.9 : 1.1 },
      uScroll: { value: new Vector2(0.02, -0.09) },  // Y-negative = smoke rises in UV space
      uNearFade: { value: 14.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying float vViewDist;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec4 mv = viewMatrix * wp;
        vViewDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform vec3 uColorD;
      uniform float uDensity;
      uniform vec2 uScroll;
      uniform float uNearFade;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying float vViewDist;

      // Value noise + fbm (iq-style), domain-warped for the liquid-gradient feel.
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p) {
        float s = 0.0, amp = 0.5;
        for (int i = 0; i < 5; i++) {
          s += vnoise(p) * amp;
          p = p * 2.03 + vec2(5.2, 1.3);
          amp *= 0.52;
        }
        return s;
      }

      void main() {
        // UV scrolled upward over time — reads as smoke rising.
        vec2 uv = vUv * 3.0 + uScroll * uTime;

        // Domain warp: sample fbm at (uv + warp(uv)). Gives organic swirls.
        vec2 q = vec2(fbm(uv), fbm(uv + vec2(1.7, 9.2)));
        vec2 r = vec2(fbm(uv + 4.0 * q + vec2(0.0, uTime * 0.12)),
                      fbm(uv + 4.0 * q + vec2(uTime * 0.08, 3.2)));
        float f = fbm(uv + 3.8 * r);
        // Remap to [0,1]
        f = clamp(0.5 + 0.6 * (f - 0.5) + 0.4 * r.x, 0.0, 1.0);

        // Palette remap across 4 stops — Heatmap/Dune style.
        vec3 c1 = mix(uColorA, uColorB, smoothstep(0.0, 0.4, f));
        vec3 c2 = mix(c1,       uColorC, smoothstep(0.35, 0.7, f));
        vec3 color = mix(c2,    uColorD, smoothstep(0.7, 1.0, f));

        // Y-zone envelope. Peak in descent band; tapered edges so smoke fades
        // smoothly into the horizon line instead of snapping off.
        float yEnv = smoothstep(2.0, -8.0, vWorldPos.y) * (1.0 - smoothstep(-90.0, -115.0, vWorldPos.y));

        // Camera-distance fades: keep near readable, cap far density.
        float nearFade = smoothstep(0.0, uNearFade, vViewDist);
        float farFade = 1.0 - smoothstep(70.0, 130.0, vViewDist);

        float alpha = f * uDensity * yEnv * nearFade * farFade;
        alpha = clamp(alpha, 0.0, 0.92);

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}
