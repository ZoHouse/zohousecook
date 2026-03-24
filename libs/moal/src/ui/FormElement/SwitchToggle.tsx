/* eslint-disable @typescript-eslint/no-explicit-any */

import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";
import ToggleSelector from "../ToggleSelector";

interface SwitchToggleProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: any;
  options: [{ label: string; value: string }, { label: string; value: string }];
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  required,
  options,
  initialValue,
}) => {
  const handleSelect = (isSelected: boolean) => {
    if (!disabled) {
      setValue(isSelected ? options[0].value : options[1].value);
    }
  };

  useEffect(() => {
    if (!value && initialValue) {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, setValue]);

  return (
    <div
      className={cn(
        "flex bg-zui-light relative justify-between items-center w-full p-6",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-zui-white")}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs",
            value === options[0]?.value ? "text-zui-green" : "text-zui-yellow"
          )}
        >
          {value === options[0]?.value ? options[0]?.label : options[1]?.label}
        </span>
        <ToggleSelector
          value={value === options[0]?.value}
          onChange={handleSelect}
        />
      </div>
    </div>
  );
};

export default SwitchToggle;
