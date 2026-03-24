/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";
interface MultiSelectProps {
  label: string;
  value: string[];
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: Array<{ value: string; label: string; hint?: string }>;
  initialValue?: any;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  name,
  options,
  setValue,
  value,
  disabled,
  required,
  initialValue,
}) => {
  const handleSelect = (selectedId: string) => {
    if (!disabled) {
      if (!value) {
        setValue([selectedId]);
        return;
      }

      if (value.includes(selectedId)) {
        const _values = value.filter((val) => val !== selectedId);
        setValue(_values);
      } else {
        const _values = [...value, selectedId];
        setValue(_values);
      }
    }
  };

  useEffect(() => {
    if (!value && initialValue) {
      setValue(initialValue);
    }
  }, []);

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
          // eslint-disable-next-line eqeqeq
          const isSelected = (value?.find(val => val == option.value)) != undefined;
          
          return (
            <li
              key={option.value}
              className={cn(
                "text-sm border px-4 py-2",
                isSelected
                  ? "border-zui-neon text-zui-neon"
                  : "border-zui-silver text-zui-white",
                disabled && "cursor-not-allowed"
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

export default MultiSelect;
