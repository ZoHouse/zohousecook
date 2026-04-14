interface MobileWaitlistBarProps {
  onApply?: () => void;
}

export function MobileWaitlistBar({ onApply }: MobileWaitlistBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3 bg-black/80 backdrop-blur-xl border-t border-white/10">
      <button
        type="button"
        onClick={onApply}
        className="bg-white/10 border border-white/15 rounded-full p-1 flex items-center w-full active:scale-[0.98] transition-transform"
      >
        <span className="text-white/60 px-4 text-xs flex-1 text-left">
          Join the waitlist
        </span>
        <span className="bg-white text-black font-bold text-[10px] tracking-widest uppercase rounded-full px-5 py-2.5 flex-shrink-0">
          apply
        </span>
      </button>
    </div>
  );
}
