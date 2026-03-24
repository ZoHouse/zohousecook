import React from "react";
import { cn } from "../utils";

interface ChipProps {
  text: string;
  selected?: boolean;
  className?: string;
}

const Chip: React.FC<ChipProps> = ({ text, className, selected = true }) => {
  return (
    <div
      className={cn(
        "text-base font-semibold text-zui-white px-4 py-3 border rounded-full",
        selected ? "border-zui-white" : "border-zui-stroke",
        className
      )}
    >
      {text}
    </div>
  );
};

export default Chip;
