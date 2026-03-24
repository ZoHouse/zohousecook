/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";

interface TimeInputProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: any;
}

const TimeInput: React.FC<TimeInputProps> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  initialValue,
  required,
}) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    // console.log(e.target.value);
    setValue(e.target.value);
  };

  const discardInput: React.MouseEventHandler<HTMLButtonElement> = () => {
    setValue("");
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
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={handleChange}
          className="bg-transparent relative outline-none text-sm text-zui-neon accent-zui-neon date__picker"
          type="time"
        />
        <button onClick={discardInput}>
          <Icon name="Cross" size={16} />
        </button>
      </div>
    </div>
  );
};

export default TimeInput;
