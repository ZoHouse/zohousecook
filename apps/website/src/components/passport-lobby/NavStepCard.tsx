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
        className="rounded-2xl border border-white/10 backdrop-blur-md text-white p-4"
        style={{
          background: 'rgba(0,0,0,0.78)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,180,255,0.12)', color: '#00B4FF' }}
          >
            <ManeuverIcon type={step.maneuver.type} modifier={step.maneuver.modifier} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold leading-tight">
              In {formatDistance(distanceToNext)}
            </div>
            <div className="text-white/85 text-sm leading-snug mt-0.5 line-clamp-2">
              {step.maneuver.instruction}
            </div>
            <div className="text-white/55 text-[11px] mt-1.5">
              {formatDuration(totalRemainingDuration)} · {formatDistance(totalRemainingDistance)} total
            </div>
          </div>
          <button
            type="button"
            onClick={onEnd}
            aria-label="End navigation"
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-xs font-semibold tracking-wide"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
}
