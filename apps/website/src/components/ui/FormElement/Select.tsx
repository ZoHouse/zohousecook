/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";

interface SelectProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: Array<{ value: string; label: string; hint?: string }>;
  initialValue?: any;
  icon: IconName;
}

const Select: React.FC<SelectProps> = ({
  label,
  name,
  options,
  icon,
  setValue,
  value,
  disabled,
  required,
  initialValue,
}) => {
  const handleSelect = (selectedId: string) => {
    if (!disabled) {
      if (value === selectedId) {
        setValue(null);
      } else {
        setValue(selectedId);
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
        "flex bg-zui-light w-full p-4 gap-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <Icon name={icon} size={24} />
      <div
        className={cn("flex flex-col relative justify-center flex-1")}
        // onClick={showInput}
      >
        <label className={cn("text-zui-white")} htmlFor={name}>
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>
        <ul className="flex flex-wrap gap-2 mt-4">
          {options?.map((option) => {
            const isSelected = value === option.value;

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
    </div>
  );
};

export default Select;
