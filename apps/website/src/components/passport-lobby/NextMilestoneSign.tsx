export function NextMilestoneSign() {
  return (
    <div className="flex flex-col items-center gap-0.5 opacity-40">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span className="text-[7px] text-neutral-500 text-center leading-tight tracking-wide">
        Next<br />Milestone
      </span>
    </div>
  );
}
