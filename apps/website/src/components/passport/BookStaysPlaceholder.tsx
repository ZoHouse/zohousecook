import React from "react";
import { useRouter } from "next/router";

const BookStaysPlaceholder: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white/80 text-sm font-semibold">Book your stays</h3>
        <button
          onClick={() => router.push("/")}
          className="text-white/50 hover:text-white text-xs transition-colors"
        >
          View all →
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center"
          >
            <span className="text-white/25 text-[11px]">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookStaysPlaceholder;
