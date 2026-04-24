// apps/website/src/components/homecoming/materials/DustShader.ts
import { ShaderMaterial, Color, Vector2, AdditiveBlending, DoubleSide } from 'three'

export type DustMode = 'raymarch' | 'billboard'

export function createDustShader(mode: DustMode): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // DoubleSide so the dust renders while the camera is inside the slab
    // (camera travels from y=-2 to y=-86 *through* this volume).
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(0xc46144) },
      uDensity: { value: mode === 'raymarch' ? 0.035 : 0.05 },
      uScroll: { value: new Vector2(0.02, 0.015) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uDensity;
      uniform vec2 uScroll;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      // Cheap 3D simplex noise approximation (Ashima's open-source variant would go here
      // in production — using layered 2D for simplicity).
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }

      void main() {
        vec2 uv = vUv + uScroll * uTime;
        float n = 0.0;
        float amp = 0.5;
        vec2 p = uv * 4.0;
        for (int i = 0; i < 4; i++) {
          n += noise2(p) * amp;
          p *= 2.02;
          amp *= 0.5;
        }
        float alpha = smoothstep(0.2, 0.8, n) * uDensity * 20.0;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}
