/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React from "react";

interface CheckboxProps {
  label: string;
  value: string[];
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: Array<{ value: string; label: string; hint?: string }>;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  options,
  setValue,
  value = [],
  disabled,
  required,
}) => {
  const handleSelect = (selectedId: string) => {
    if (value.includes(selectedId)) {
      const newValue = value.filter((id: string) => id !== selectedId);
      setValue(newValue);
    } else {
      const newValue = [...value, selectedId];
      setValue(newValue);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-zui-light relative justify-center w-full px-6 py-6",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-xs text-zui-white")}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>

      <ul className="flex flex-wrap gap-2 mt-4">
        {options?.map((option) => {
          const isSelected = value.includes(option.value);

          return (
            <li
              key={option.value}
              className={cn(
                "text-sm border  px-4 py-2",
                isSelected
                  ? "border-zui-neon text-zui-neon"
                  : "border-zui-silver text-zui-white"
              )}
              onClick={handleSelect.bind(null, option.value)}
            >
              {option.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Checkbox;
