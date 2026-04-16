export interface TravelersPillProps {
  count?: number;
}

export function TravelersPill({ count = 14 }: TravelersPillProps) {
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5 text-white text-[11px]"
      style={{
        background: 'rgba(32,32,32,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex" aria-hidden>
        <div className="w-6 h-6 rounded-full bg-neutral-600 border-2 border-neutral-800" />
        <div className="w-6 h-6 rounded-full bg-neutral-500 border-2 border-neutral-800 -ml-2" />
        <div className="w-6 h-6 rounded-full bg-neutral-700 border-2 border-neutral-800 -ml-2" />
      </div>
      <span className="font-medium">{count} Travellers around</span>
    </div>
  );
}
