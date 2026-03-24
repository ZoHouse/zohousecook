import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";

interface NumberSpinnerProps {
  label: string;
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  minValue?: number;
  maxValue?: number;
  steps?: number;
  options?: Array<{ value: string; label: string; hint?: string }>;
}

const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  label,
  name,
  setValue,
  value = 0,
  disabled,
  required,
  maxValue = Infinity,
  minValue = -Infinity,
  steps = 1,
  options,
}) => {
  const increaseCount = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (options && options.length > 0) {
      const index = options.findIndex((option) => +option.value === value);
      if (index !== -1 && index < options.length - 1) {
        setValue(Number(options[index + 1].value));
      }
    } else if (value + steps <= maxValue) {
      setValue(value + steps);
    }
  };

  const decreaseCount = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (options && options.length > 0) {
      const index = options.findIndex((option) => +option.value === value);
      if (index !== -1 && index > 0) {
        setValue(Number(options[index - 1].value));
      }
    } else if (value - steps >= minValue) {
      setValue(value - steps);
    }
  };

  useEffect(() => {
    if (value < minValue) {
      setValue(minValue);
    } else if (value > maxValue) {
      setValue(maxValue);
    }
  }, [value, minValue, maxValue, setValue]);

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-zui-light relative w-full px-6 py-6",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-xs text-zui-white")}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>
      <div className="flex space-x-4">
        <button onClick={decreaseCount} disabled={disabled}>
          <Icon name="Minus" size={16} fill="#CFFF50" />
        </button>
        <span>{value}</span>
        <button onClick={increaseCount} disabled={disabled}>
          <Icon name="Plus" size={16} fill="#CFFF50" />
        </button>
      </div>
    </div>
  );
};

export default NumberSpinner;
