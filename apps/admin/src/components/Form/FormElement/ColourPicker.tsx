/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";

interface ColourPickerProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue: string;
}

const ColourPicker: React.FC<ColourPickerProps> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  required,
  initialValue,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setValue(newColor);
  };

  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
  }, []);
  return (
    <div
      className={cn(
        "flex  bg-zui-light relative items-center justify-between w-full px-6 py-6",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-xs text-zui-white")}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>

      <input
        className="w-20 border-none shadow-none outline-none"
        type="color"
        value={value}
        id=""
        onChange={handleChange}
      />
    </div>
  );
};

export default ColourPicker;
