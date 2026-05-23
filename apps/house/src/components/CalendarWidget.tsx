import { useState, useEffect } from "react";

import { CalendarGrid } from "./CalendarGrid";

// Floating events widget. Lives on every page via _app.tsx. A compact pill
// sits bottom-right; clicking opens a modal with the live Luma calendar.
// The iframe only mounts while the modal is open so we don't pay the network
// cost on every page load.
export function CalendarWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open events calendar"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-l-full border border-r-0 border-[#c5a572]/40 bg-black/90 backdrop-blur-md text-white shadow-[0_0_18px_rgba(197,165,114,0.45),0_0_38px_rgba(197,165,114,0.22),0_8px_22px_rgba(0,0,0,0.55)] hover:shadow-[0_0_26px_rgba(197,165,114,0.7),0_0_55px_rgba(197,165,114,0.35),0_8px_22px_rgba(0,0,0,0.55)] hover:border-[#c5a572] hover:bg-black transition-all duration-300"
      >
        <svg
          className="w-4 h-4 text-[#c5a572]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="text-[10px] tracking-[2px] uppercase font-mono">
          Live events
        </span>
        <span
          className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-[#c5a572] animate-pulse"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Events calendar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-black border border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-[9px] tracking-[3px] uppercase text-white/40 font-mono">
                  Calendar
                </p>
                <p className="font-[family-name:var(--font-headline)] italic text-base text-white leading-none mt-0.5">
                  Live events
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close events calendar"
                className="grid place-items-center w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CalendarGrid />
            <div className="px-4 py-2 border-t border-white/10 text-center">
              <a
                href="https://luma.com/blrxzo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] tracking-[3px] uppercase text-white/40 font-mono hover:text-[#c5a572] transition-colors"
              >
                See all on Luma →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
