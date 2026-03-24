import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";

interface CheckboxProps {
  label: string;
  value: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: Array<{ value: string; label: string; hint?: string }>;
  icon: IconName;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  options,
  icon,
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
        "flex bg-zui-light w-full p-4 gap-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <Icon name={icon} size={24} />
      <div className={cn("flex flex-col relative justify-center flex-1")}>
        <label className={cn("text-zui-white")}>
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
    </div>
  );
};

export default Checkbox;
