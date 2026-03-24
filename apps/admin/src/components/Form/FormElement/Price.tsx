import { Currency } from "@zo/definitions/admin";
import { isValidNumber } from "@zo/utils/number";
import { InputNumber } from "antd";
import React, { useEffect, useState } from "react";

type PriceProps = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value: number | undefined;
  setValue: (data: number | undefined) => void;
  initialValue?: number | undefined;
  currency: Currency | undefined;
  size?: "small" | "middle" | "large";
  variant?: "borderless" | "filled" | "outlined" | undefined;
  min?: number;
  max?: number;
};

const Price: React.FC<PriceProps> = ({
  label,
  name,
  placeholder,
  required = false,
  disabled = false,
  value,
  setValue,
  currency,
  size,
  variant,
  min = 0,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(
    value
      ? +value * Math.pow(10, currency?.decimals ? -currency.decimals : 0)
      : 0
  );

  useEffect(() => {
    if (currency && displayValue)
      setValue(displayValue * Math.pow(10, currency.decimals));
  }, [displayValue, currency, setValue]);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(
        +value * Math.pow(10, currency?.decimals ? -currency.decimals : 0)
      );
    }
  }, [currency, value]);

  return (
    <div>
      <InputNumber
        size={size}
        variant={variant}
        id={name}
        addonAfter={currency?.code || "INR"}
        min={min}
        max={max}
        placeholder={placeholder}
        defaultValue={0}
        disabled={disabled}
        value={isValidNumber(displayValue) ? displayValue : undefined}
        onChange={(newValue: number | null) => setDisplayValue(newValue || 0)}
        status={required && !displayValue ? "error" : undefined}
        className="w-full"
      />
      {!currency && (
        <div className="text-zui-red text-xs mt-1">
          Warning: Currency information not available
        </div>
      )}
    </div>
  );
};

export default Price;
