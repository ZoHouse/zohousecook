import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";

interface CheckboxInputProps {
  label?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({
  label,
  checked,
  onChange,
  className,
}) => {
  function handleClick(
    value: boolean,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.stopPropagation();
    onChange(value);
  }
  return (
    <div className={cn("h-6", className)}>
      {checked ? (
        <button onClick={handleClick.bind(null, false)}>
          <Icon name="CheckboxChecked" size={24} fill="#fff" />
        </button>
      ) : (
        <button onClick={handleClick.bind(null, true)}>
          <Icon name="CheckBox" size={24} fill="#fff" />
        </button>
      )}
    </div>
  );
};

export default CheckboxInput;
