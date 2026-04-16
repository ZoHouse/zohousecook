export interface PedestalProps {
  className?: string;
}

export function Pedestal({ className = '' }: PedestalProps) {
  return (
    <div
      className={`w-28 h-4 rounded-[50%] ${className}`}
      style={{
        background:
          'radial-gradient(ellipse at center, #ffffff 0%, #888 40%, rgba(0,0,0,0.3) 80%, transparent 100%)',
      }}
      aria-hidden
    />
  );
}
