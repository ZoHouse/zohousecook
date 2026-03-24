/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import React, { useEffect, useRef, useState } from "react";

interface TextareaProps {
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  value,
  setValue,
  name,
  label,
  initialValue,
  required,
  disabled,
  placeholder,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTextAreaVisible, setTextAreaVisible] = useState<boolean>(
    isValidString(placeholder)
  );

  const showTextArea = () => {
    setTextAreaVisible(true);
    textareaRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = () => {
    if (!isValidString(placeholder) && (value == null || value?.length === 0)) {
      setTextAreaVisible(false);
    }
  };

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, []);

  useEffect(() => {
    if (value) {
      setTextAreaVisible(true);
    } else if (!isTextAreaVisible) {
      if (!isValidString(placeholder)) {
        setTextAreaVisible(false);
      }
    }
  }, [value]);

  return (
    <div
      className={cn(
        "flex flex-col bg-zui-light relative justify-center w-full",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={showTextArea}
    >
      <label
        className={cn(
          "text-xs absolute left-6 top-6 transition-all ease-in-out duration-100",
          !isTextAreaVisible
            ? "text-zui-white"
            : "text-zui-silver -translate-y-3"
        )}
        htmlFor={name}
      >
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>
      <textarea
        id={name}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "w-full relative h-24 px-6 zui-form-element resize-none placeholder:text-zui-silver mt-[28px] font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
        )}
        value={value}
        onFocus={showTextArea}
        onBlur={handleBlur}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  );
};

export default Textarea;
