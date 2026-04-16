export interface TravelersPillProps {
  count?: number;
}

export function TravelersPill({ count = 14 }: TravelersPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 pl-1 pr-4 py-1 text-white text-xs">
      <div className="flex" aria-hidden>
        <div className="w-5 h-5 rounded-full bg-neutral-600 border-2 border-neutral-900" />
        <div className="w-5 h-5 rounded-full bg-neutral-500 border-2 border-neutral-900 -ml-1.5" />
        <div className="w-5 h-5 rounded-full bg-neutral-700 border-2 border-neutral-900 -ml-1.5" />
      </div>
      <span>{count} Travellers around</span>
    </div>
  );
}
