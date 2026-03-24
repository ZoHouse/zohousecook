import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";

interface RadioProps {
  label: string;
  value: string;
  setValue: React.Dispatch<any>;
  icon: IconName;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: Array<{ value: string; label: string; hint?: string }>;
}

const Radio: React.FC<RadioProps> = ({
  label,
  name,
  options,
  setValue,
  value,
  disabled,
  icon,
  required,
}) => {
  return (
    <div
      className={cn(
        "flex bg-zui-light w-full p-4 gap-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <Icon name={icon} size={24} />
      <div className={cn("flex flex-col relative justify-center flex-1")}>
        <label className={cn("text-zui-white")} htmlFor={name}>
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>
        <ul className="space-y-6 mt-4">
          {options.map(
            (option: { value: string; label: string; subtext?: string }) => (
              <li
                className="flex items-start justify-between"
                onClick={setValue.bind(null, option.value)}
                key={option.value}
              >
                <div>
                  <h5 className=" font-normal">{option.label}</h5>
                  <span className="text-[14px] font-normal text-zui-silver">
                    {option.subtext}
                  </span>
                </div>
                {value === option.value ? (
                  <Icon name="RadioChecked" size={24} fill="#CFFF50" />
                ) : (
                  <Icon name="Radio" size={24} />
                )}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export default Radio;
