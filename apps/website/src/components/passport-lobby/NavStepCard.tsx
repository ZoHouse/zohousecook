import type { RouteStep } from './poi/fetchRoute';
import { formatDistance, formatDuration } from './poi/fetchRoute';

interface NavStepCardProps {
  step: RouteStep;
  /** Metres remaining until the step's maneuver point. */
  distanceToNext: number;
  /** Seconds remaining to destination across all not-yet-completed steps. */
  totalRemainingDuration: number;
  /** Metres remaining to destination across all not-yet-completed steps. */
  totalRemainingDistance: number;
  onEnd: () => void;
}

// Rotation in degrees from "straight up". Mapbox's modifier vocabulary is
// fixed — see https://docs.mapbox.com/api/navigation/directions/#routestep-object
const MODIFIER_ANGLE: Record<string, number> = {
  straight: 0,
  'slight right': 35,
  right: 90,
  'sharp right': 135,
  uturn: 180,
  'sharp left': -135,
  left: -90,
  'slight left': -35,
};

function ManeuverIcon({
  type,
  modifier,
  size = 32,
}: {
  type: string;
  modifier?: string;
  size?: number;
}) {
  if (type === 'arrive') {
    // Checkered destination flag
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21V4l8 2 8-2v12l-8 2-8-2z" />
        <line x1="4" y1="4" x2="4" y2="21" />
        <path d="M4 6h4v4H4M12 6v4h4V6M16 10v4h4v-4M8 10v4h4v-4" fill="currentColor" stroke="none" opacity="0.85" />
      </svg>
    );
  }
  if (type === 'depart') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  // Everything else (turn, continue, merge, fork, on/off ramp, end of road, …)
  // renders as a rotated arrow. Roundabout would deserve its own icon — TODO.
  const rotation = MODIFIER_ANGLE[modifier ?? 'straight'] ?? 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <line x1="12" y1="20" x2="12" y2="4" />
      <polyline points="6 10 12 4 18 10" />
    </svg>
  );
}

export function NavStepCard({
  step,
  distanceToNext,
  totalRemainingDuration,
  totalRemainingDistance,
  onEnd,
}: NavStepCardProps) {
  return (
    <div
      className="absolute left-3 right-3 bottom-3 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-2xl backdrop-blur-md p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(251,248,244,0.9) 100%)',
          border: '1px solid rgba(255,255,255,0.95)',
          color: '#2A1B3D',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 32px rgba(120,100,160,0.28)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(42,27,61,0.08)', color: '#2A1B3D' }}
          >
            <ManeuverIcon type={step.maneuver.type} modifier={step.maneuver.modifier} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold leading-tight" style={{ color: '#2A1B3D' }}>
              In {formatDistance(distanceToNext)}
            </div>
            <div className="text-sm leading-snug mt-0.5 line-clamp-2" style={{ color: 'rgba(42,27,61,0.85)' }}>
              {step.maneuver.instruction}
            </div>
            <div className="text-[11px] mt-1.5" style={{ color: '#6B5B8E' }}>
              {formatDuration(totalRemainingDuration)} · {formatDistance(totalRemainingDistance)} total
            </div>
          </div>
          <button
            type="button"
            onClick={onEnd}
            aria-label="End navigation"
            className="flex-shrink-0 px-3 py-1.5 rounded-full transition text-xs font-semibold tracking-wide"
            style={{
              background: 'rgba(42,27,61,0.08)',
              color: '#2A1B3D',
              border: '1px solid rgba(42,27,61,0.12)',
            }}
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
}
