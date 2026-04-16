export interface XpProgressBarProps {
  current: number;
  max: number;
  className?: string;
}

export function XpProgressBar({ current, max, className = '' }: XpProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div
      className={`w-full h-1 bg-neutral-700 rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #6fc4e0 0%, #FEDD1E 100%)',
        }}
      />
    </div>
  );
}
