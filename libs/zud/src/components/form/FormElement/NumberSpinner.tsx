import { InputNumber, Button } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
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
  size?: "small" | "middle" | "large";
  variant?: "borderless" | "filled" | "outlined";
  buttonVariant?:
    | "filled"
    | "outlined"
    | "link"
    | "text"
    | "dashed"
    | "solid"
    | undefined;
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
  size,
  variant,
  buttonVariant,
}) => {
  const increaseCount = () => {
    if (options && options.length > 0) {
      const index = options.findIndex((option) => +option.value === value);
      if (index !== -1 && index < options.length - 1) {
        setValue(Number(options[index + 1].value));
      }
    } else if (value + steps <= maxValue) {
      setValue(value + steps);
    }
  };

  const decreaseCount = () => {
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
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <InputNumber
          size={size}
          variant={variant}
          id={name}
          value={value}
          onChange={(newValue) => setValue(newValue || 0)}
          min={minValue}
          max={maxValue}
          step={steps}
          disabled={disabled}
          required={required}
          addonBefore={label}
          controls={false} // Disable default controls as we're using custom buttons
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size={size}
          variant={buttonVariant}
          icon={<MinusOutlined />}
          onClick={decreaseCount}
          disabled={disabled || value <= minValue}
          type="primary"
          ghost
        />
        <Button
          size={size}
          variant={buttonVariant}
          icon={<PlusOutlined />}
          onClick={increaseCount}
          disabled={disabled || value >= maxValue}
          type="primary"
          ghost
        />
      </div>
    </div>
  );
};

export default NumberSpinner;
