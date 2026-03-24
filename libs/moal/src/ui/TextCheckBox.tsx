import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import React from "react";

interface TextCheckBoxProps {
  value: boolean;
  setValue: (value: boolean) => void;
  className?: string;
  label?: string;
}
const TextCheckBox: React.FC<TextCheckBoxProps> = ({
  setValue,
  value,
  className,
  label,
}) => {
  return (
    <div className={cn("flex gap-1 items-center", className)}>
      <div onClick={setValue?.bind(null, !value)} role="button">
        {value ? (
          <Icon name="CheckboxChecked" size={16} />
        ) : (
          <Icon name="CheckBox" size={16} />
        )}
      </div>
      {isValidString(label) && (
        <label htmlFor="franchise" className="text-zui-white text-sm">
          {label}
        </label>
      )}
    </div>
  );
};

export default TextCheckBox;
