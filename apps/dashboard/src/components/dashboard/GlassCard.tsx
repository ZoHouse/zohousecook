import React, { ReactNode } from "react";
import cn from "../../utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-dash-bg backdrop-blur-dash-md border border-dash-border rounded-dash-lg shadow-dash-card",
        onClick &&
          "cursor-pointer hover:border-dash-border-hover transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
