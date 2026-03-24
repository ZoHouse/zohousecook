/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import moment from "moment";
import React, { useEffect } from "react";

interface DatetimeInputProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  initialValue?: any;
  disabled?: boolean;
}

const DatetimeInput: React.FC<DatetimeInputProps> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  required,
  initialValue,
}) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    if (initialValue && !value) {
      setValue(moment(initialValue).format("YYYY-MM-DDTHH:mm"));
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
        value={value && moment(value).format("YYYY-MM-DDTHH:mm")}
        onChange={handleChange}
        className="bg-transparent relative outline-none text-sm text-zui-neon accent-zui-neon date__picker"
        type="datetime-local"
      />
    </div>
  );
};

export default DatetimeInput;
