/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React, { useEffect } from "react";
interface TextCheckboxProps {
  label: string;
  value: boolean;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: boolean;
}

const TextCheckbox: React.FC<TextCheckboxProps> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  required,
  initialValue,
}) => {
  const handleToggle = () => {
    setValue(!value);
  };

  useEffect(() => {
    setValue(initialValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      role="button"
      onClick={handleToggle}
      className={cn(
        "flex bg-zui-light relative justify-between w-full px-6 py-6",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-base text-zui-white")} htmlFor={name}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>
      {value ? (
        <span>
          <Icon name="CheckboxChecked" size={24} fill="#CFFF50" />
        </span>
      ) : (
        <span>
          <Icon name="CheckBox" size={24} fill="#fff" />
        </span>
      )}
    </div>
  );
};

export default TextCheckbox;
