/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import React, { useEffect, useRef, useState } from "react";

interface InputProps {
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  type: "text" | "number" | "email";
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  userMessage?: React.ReactNode | null;
}

const Input: React.FC<InputProps> = ({
  value,
  setValue,
  name,
  label,
  initialValue,
  required,
  disabled,
  type,
  max = Infinity,
  min = -Infinity,
  placeholder,
  userMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInputVisible, setInputVisible] = useState<boolean>(
    isValidString(placeholder) || initialValue
  );

  const showInput = () => {
    setInputVisible(true);
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      if (isValidString(e.target.value)) {
        setValue(+e.target.value);
      } else {
        setValue(null);
      }
    } else {
      setValue(e.target.value);
    }
  };

  const handleBlur = () => {
    if (!isValidString(placeholder) && (value == null || value?.length === 0)) {
      setInputVisible(false);
    }
  };

  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
  }, []);

  useEffect(() => {
    if (value) {
      setInputVisible(true);
    } else if (!isInputVisible) {
      if (!isValidString(placeholder)) {
        setInputVisible(false);
      }
    }
  }, [value]);

  return (
    <div className="w-full flex flex-col">
      <div
        className={cn(
          "flex flex-col bg-zui-light relative justify-center w-full rounded-xl",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
        onClick={showInput}
      >
        <label
          className={cn(
            "text-base absolute left-6 transition-all ease-in-out duration-100",
            !isInputVisible
              ? "text-zui-white"
              : "text-zui-silver -translate-y-4"
          )}
          htmlFor={name}
        >
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>
        <input
          min={min}
          ref={inputRef}
          max={max}
          id={name}
          type={type}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full relative h-16 px-6 zui-form-element placeholder:text-zui-silver pt-[16px] font-light text-base caret-white outline-none focus:outline-none bg-transparent"
          )}
          value={value}
          onFocus={showInput}
          onBlur={handleBlur}
          disabled={disabled}
          onChange={handleChange}
        />
      </div>
      {isValidString(value) && userMessage && (
        <span className="text-xxs text-right w-full my-2">{userMessage}</span>
      )}
    </div>
  );
};

export default Input;
