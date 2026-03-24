import React from "react";

interface AvailabilityCalendarFooterProps {
  totalInventories: number;
  totalDays: number;
}

interface AvailabilityStatusIndicatorProps {
  color: string;
  label: string;
}

export const AvailabilityCalendarFooter: React.FC<
  AvailabilityCalendarFooterProps
> = ({ totalInventories, totalDays }) => {
  return (
    <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-zui-lightest px-6 py-4 text-xs">
      {/* Summary Section */}
      <div className="mb-2 sm:mb-0">
        <p className="text-xs font-medium tracking-wide">
          Showing{" "}
          <span className="text-zui-neon font-semibold">
            {totalInventories}
          </span>{" "}
          room{totalInventories !== 1 ? "s" : ""} across{" "}
          <span className="text-zui-neon font-semibold">{totalDays}</span> day
          {totalDays !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center gap-4 bg-zui-lighter px-3 py-2 border border-zui-lightest">
        <AvailabilityStatusIndicator color="bg-zui-green" label="Available" />
        <AvailabilityStatusIndicator color="bg-zui-red" label="Not Available" />
      </div>
    </footer>
  );
};

const AvailabilityStatusIndicator: React.FC<
  AvailabilityStatusIndicatorProps
> = ({ color, label }) => (
  <span className="flex items-center gap-1 text-xs font-medium">
    <span
      className={`w-3 h-3 rounded-full ${color}`}
      aria-label={`${label} status indicator`}
    />
    {label}
  </span>
);

export default AvailabilityCalendarFooter;
