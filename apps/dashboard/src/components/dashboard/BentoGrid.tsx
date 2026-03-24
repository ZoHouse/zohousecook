import React, { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-dash-xl py-dash-xl">
      <div className="grid gap-dash-xl grid-cols-1 md:grid-cols-2 lg:grid-cols-[300px_1fr_300px] auto-rows-min">
        {children}
      </div>
    </div>
  );
}
