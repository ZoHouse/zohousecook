/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";

interface DateInputProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: any;
}

const DateInput: React.FC<DateInputProps> = ({
  label,
  name,
  value,
  setValue,
  disabled,
  required,
  initialValue,
}) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    if (initialValue && !value) {
      new Date(initialValue).toISOString().slice(0, 10);
    }
  }, []);

  return (
    <div
      className={cn(
        "flex items-center bg-zui-light relative justify-between w-full px-6 py-6",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-xs text-zui-white")}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>
      <input
        value={value && new Date(value).toISOString().slice(0, 10)}
        onChange={handleChange}
        className="bg-transparent relative outline-none text-sm text-zui-neon accent-zui-neon date__picker"
        type="date"
      />
    </div>
  );
};

export default DateInput;
