import Icon, { IconName } from "@zo/assets/icons";
import React from "react";
import { cn } from "../../utils";

interface TextRadioButtonProps {
  value: string;
  options: Array<{ label: string; value: string; icon?: IconName }>;
  onSelect: (value: string) => void;
  className?: string;
}

const TextRadioButton: React.FC<TextRadioButtonProps> = ({
  onSelect,
  options,
  value,
  className,
}) => {
  return (
    <ul
      className={cn(
        "w-full flex flex-col divide-y divide-zui-light",
        className
      )}
    >
      {options.map((option) => (
        <li
          role="button"
          onClick={onSelect.bind(null, option.value)}
          className="flex  justify-between items-center px-2 py-4"
          key={option.value}
        >
          <div className="flex items-center gap-2">
            <Icon name={option.icon || "Info"} size={20} fill="#5a5a5a" />
            <span>{option.label}</span>
          </div>
          <Icon
            name={value === option.value ? "RadioChecked" : "Radio"}
            fill={value === option.value ? "#CFFF50" : "#5a5a5a"}
            size={20}
          />
        </li>
      ))}
    </ul>
  );
};

export default TextRadioButton;
