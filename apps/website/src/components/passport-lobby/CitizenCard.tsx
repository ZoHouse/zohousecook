import { Avatar2D } from './Avatar2D';
import { rubikClassName, syneClassName } from '../utils/font';

export interface CitizenCardProps {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  /** Kept in the interface for future binding; not rendered in the current card. */
  xpTotal?: number;
  /** Kept in the interface for future binding; not rendered in the current card. */
  rankTitle?: string;
  onUpsell: () => void;
}

const GRADIENT_PRIVATE_CARD = 'linear-gradient(180deg, #292929 0%, #000000 100%)';

export function CitizenCard({ displayName, avatarUrl, onUpsell }: CitizenCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUpsell}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUpsell(); } }}
      className={`text-left cursor-pointer ${rubikClassName}`}
      style={{
        width: 200,
        background: GRADIENT_PRIVATE_CARD,
        borderRadius: 20,
        padding: 12,
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
        boxShadow: '0px 4px 4px rgba(0,0,0,0.25), inset 0px 1.93px 7.71px rgba(255,255,255,0.25)',
      }}
    >
      {/* Avatar portrait */}
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 10, width: 176, height: 176 }}>
        <Avatar2D avatarUrl={avatarUrl} displayName={displayName} />
      </div>

      {/* Name — Syne 700, 24px */}
      <div
        className={syneClassName}
        style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: '1.2em', marginBottom: 2 }}
      >
        {displayName}
      </div>
      {/* Subtitle — Rubik 400, 12px, 55% opacity */}
      <div style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>
        Citizen of Zo World
      </div>
    </div>
  );
}
