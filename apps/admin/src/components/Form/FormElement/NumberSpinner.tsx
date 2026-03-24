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
  options?: Array<{
    value: string;
    label: string | React.ReactNode;
    hint?: string;
  }>;
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
      const currentIndex = options.findIndex(option => Number(option.value) === value);
      if (currentIndex < options.length - 1) {
        setValue(Number(options[currentIndex + 1].value));
      }
    } else if (value + steps <= maxValue) {
      setValue(value + steps);
    }
  };

  const decreaseCount = () => {
    if (options && options.length > 0) {
      const currentIndex = options.findIndex(option => Number(option.value) === value);
      if (currentIndex > 0) {
        setValue(Number(options[currentIndex - 1].value));
      }
    } else if (value - steps >= minValue) {
      setValue(value - steps);
    }
  };

  useEffect(() => {
    if (options && options.length > 0) {
      // If value is not in options, set to first option
      if (!options.some(option => Number(option.value) === value)) {
        setValue(Number(options[0].value));
      }
    } else {
      // Normal min/max validation
      if (value < minValue) {
        setValue(minValue);
      } else if (value > maxValue) {
        setValue(maxValue);
      }
    }
  }, [value, minValue, maxValue, setValue, options]);

  const isMinDisabled = options 
    ? options[0] && Number(options[0].value) === value
    : value <= minValue;

  const isMaxDisabled = options
    ? options[options.length - 1] && Number(options[options.length - 1].value) === value
    : value >= maxValue;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <InputNumber
          size={size}
          variant={variant}
          id={name}
          value={value}
          onChange={(newValue) => setValue(newValue || 0)}
          min={options ? Number(options[0]?.value) : minValue}
          max={options ? Number(options[options.length - 1]?.value) : maxValue}
          step={steps}
          disabled={disabled}
          required={required}
          addonBefore={label}
          controls={false}
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size={size}
          variant={buttonVariant}
          icon={<MinusOutlined />}
          onClick={decreaseCount}
          disabled={disabled || isMinDisabled}
          type="primary"
          ghost
        />
        <Button
          size={size}
          variant={buttonVariant}
          icon={<PlusOutlined />}
          onClick={increaseCount}
          disabled={disabled || isMaxDisabled}
          type="primary"
          ghost
        />
      </div>
    </div>
  );
};

export default NumberSpinner;
