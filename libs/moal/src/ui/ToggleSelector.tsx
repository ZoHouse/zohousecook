import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import React from "react";

interface ToggleSelectorProp {
  value: boolean;
  onChange: (value: boolean, data?: GeneralObject) => void;
  className?: string;
  data?: GeneralObject;
}

const ToggleSelector: React.FC<ToggleSelectorProp> = ({
  onChange,
  value,
  data = {},
  className,
}) => {
  return (
    <div
      className={cn(
        `cursor-pointer flex items-center  w-10 h-6 px-1 flex-shrink-0 `,
        value ? "bg-zui-green" : "bg-gray-300",
        className
      )}
      onClick={onChange.bind(null, !value, data)}
    >
      <div
        className={cn(
          `w-4 h-4 bg-white transform transition-transform`,
          value ? "translate-x-full" : "translate-x-0"
        )}
      ></div>
    </div>
  );
};

export default ToggleSelector;
