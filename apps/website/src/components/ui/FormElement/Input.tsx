import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import React, { useEffect, useRef, useState } from "react";

interface InputProps {
  icon: IconName;
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  type: "text" | "number" | "email";
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  value,
  setValue,
  name,
  icon,
  label,
  initialValue,
  required,
  disabled,
  type,
  placeholder,
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
      setValue(+e.target.value);
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
    if (initialValue) {
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
    <div
      className={cn(
        "flex bg-zui-light w-full p-4 gap-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <Icon name={icon} size={24} />
      <div
        className={cn("flex flex-col relative justify-center flex-1")}
        onClick={showInput}
      >
        <label className={cn("text-zui-white")} htmlFor={name}>
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full relative mt-1 zui-form-element placeholder:text-zui-silver font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
          )}
          value={value}
          onFocus={showInput}
          onBlur={handleBlur}
          disabled={disabled}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default Input;
