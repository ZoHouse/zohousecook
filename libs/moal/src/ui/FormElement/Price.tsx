/* eslint-disable @typescript-eslint/no-explicit-any */
import { Currency } from "@zo/definitions/admin";
import { useOutsideClick } from "@zo/utils/hooks";
import { isValidNumber } from "@zo/utils/number";
import { isValidString } from "@zo/utils/string";
import cn from "classnames";
import React, { useEffect, useRef, useState } from "react";

type PriceProps = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value: any;
  setValue: (data: any) => void;
  initialValue?: any;
  currency: Currency | undefined;
};

const Price: React.FC<PriceProps> = ({
  label,
  name,
  placeholder,
  required = false,
  disabled = false,
  value,
  initialValue,
  setValue,
  currency,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInputVisible, setInputVisible] = useState<boolean>(
    isValidString(placeholder) || initialValue
  );

  const [displayValue, setDisplayValue] = useState<number>(
    +value * Math.pow(10, currency?.decimals ? -currency.decimals : 0)
  );
  useEffect(() => {
    if (currency) setValue(displayValue * Math.pow(10, currency.decimals));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue, currency]);

  const showInput = () => {
    setInputVisible(true);
    inputRef.current?.focus();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(+event.target.value);
  };

  const handleBlur = () => {
    if (!isValidString(placeholder) && (value == null || value?.length === 0)) {
      setInputVisible(false);
    }
  };

  useOutsideClick(inputRef, () => {
    if (!isValidNumber(value) && !isValidNumber(displayValue)) {
      setInputVisible(false);
    }
  });

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(
        +value *
          Math.pow(10, currency?.decimals ? -currency.decimals.toFixed(2) : 0)
      );
    }
  }, [currency, value]);

  useEffect(() => {
    if (isValidNumber(value) || isValidNumber(displayValue)) {
      setInputVisible(true);
    } else if (!isInputVisible) {
      if (!isValidString(placeholder)) {
        setInputVisible(false);
      }
    }
  }, [value, displayValue, placeholder, isInputVisible]);

  return (
    <div
      ref={inputRef}
      className={cn(
        "flex flex-col bg-zui-light relative justify-center w-full",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={showInput}
    >
      <label
        className={cn(
          "text-xs absolute left-6 transition-all ease-in-out duration-100",
          !isInputVisible ? "text-zui-white" : "text-zui-silver -translate-y-3"
        )}
        htmlFor={name}
      >
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>
      <div className="flex px-6 mt-[10px] gap-4 items-center justify-between relative text-white">
        <input
          min={0}
          id={name}
          type={"number"}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "flex-1 relative h-16 zui-form-element placeholder:text-zui-silver font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
          )}
          value={displayValue}
          onFocus={showInput}
          onBlur={handleBlur}
          disabled={disabled}
          onChange={handleChange}
        />
        <button className={cn("flex items-center gap-2 uppercase")}>
          {currency?.code || "INR"}
        </button>
      </div>
    </div>
  );
};

export default Price;
