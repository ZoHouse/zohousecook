export function GhostVisitors() {
  return (
    <div className="flex gap-2 items-end" aria-hidden>
      <div className="w-8 h-20 rounded-t-full opacity-[0.06]"
        style={{ background: 'linear-gradient(180deg, transparent 0%, #fff 100%)' }} />
      <div className="w-7 h-16 rounded-t-full opacity-[0.04]"
        style={{ background: 'linear-gradient(180deg, transparent 0%, #fff 100%)' }} />
    </div>
  );
}
