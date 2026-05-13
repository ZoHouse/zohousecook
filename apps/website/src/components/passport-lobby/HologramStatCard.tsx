import { MeshGradient } from '@paper-design/shaders-react';
import { syneClassName } from '../utils/font';

// Same palette as CitizenCard so the bento reads as the same material.
const DEFAULT_HOLOGRAM_COLORS = ['#0051FF', '#4DFF00', '#FFE500', '#FF6F00', '#0051FF'];

export interface HologramStatCardProps {
  value: string | number;
  label: string;
  /** Iridescent palette — each card can have its own dominant hue while
      keeping the multi-stop hologram shimmer. */
  colors?: string[];
}

export function HologramStatCard({ value, label, colors = DEFAULT_HOLOGRAM_COLORS }: HologramStatCardProps) {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        borderRadius: 14,
        padding: '14px 10px',
        aspectRatio: '1 / 1',
        background: 'linear-gradient(180deg, #292929 0%, #000000 100%)',
        boxShadow:
          '0px 4px 4px rgba(0,0,0,0.25), inset 0px 1.93px 7.71px rgba(255,255,255,0.25)',
      }}
    >
      <MeshGradient
        colors={colors}
        speed={0.6}
        scale={1.4}
        distortion={0.6}
        swirl={0.55}
        grainMixer={0.05}
        grainOverlay={0.08}
        fit="cover"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />
      {/* Diagonal sheen */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.08) 50%, transparent 80%)',
          zIndex: 2,
          mixBlendMode: 'overlay',
        }}
      />

      <div
        className={syneClassName}
        style={{
          position: 'relative',
          zIndex: 3,
          fontSize: typeof value === 'string' && value.length > 4 ? 14 : 22,
          fontWeight: 700,
          color: '#0A0A0A',
          lineHeight: '1em',
          textAlign: 'center',
        }}
      >
        {value}
      </div>
      {label && (
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.75)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
