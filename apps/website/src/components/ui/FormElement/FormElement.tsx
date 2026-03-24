/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconName } from "@zo/assets/icons";
import React from "react";
import Checkbox from "./Checkbox";
import Input from "./Input";
import Radio from "./Radio";
import Select from "./Select";

export type FormElementType =
  | "text" // ✅
  | "number" // ✅
  | "email" // ✅
  | "radio"
  | "multiselect"
  | "select"; // ✅

export type FormElement = Omit<FormElementProps, "value" | "setValue">;

export interface FormElementProps {
  icon: IconName;
  className?: string;
  name: string;
  alias?: string;
  label: string;
  type: FormElementType;
  initialValue?: string;
  placeholder?: string;
  multiSelect?: boolean;
  options?: Array<{ label: string; value: string; subtext?: string }>;
  hideLabel?: boolean;
  value: any;
  setValue: React.Dispatch<any>;
  mediaKey?: string;
  labelTopAligned?: boolean;
  labelWidthClass?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  isHidden?: boolean;
}

const FormElement: React.FC<FormElementProps> = ({
  name,
  type,
  value,
  icon,
  required,
  placeholder,
  options,
  label,
  disabled,
  setValue,
  initialValue,
  isHidden,
  children,
}) => {
  const getFormComponent = () => {
    switch (type) {
      case "text":
      case "number":
      case "email":
        return (
          !isHidden && (
            <Input
              label={label}
              type={type}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
              icon={icon}
            />
          )
        );
      case "radio":
        return (
          !isHidden &&
          options && (
            <Radio
              label={label}
              required={required}
              icon={icon}
              disabled={disabled}
              options={options}
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );

      case "multiselect":
        return (
          !isHidden &&
          options && (
            <Checkbox
              label={label}
              required={required}
              disabled={disabled}
              options={options}
              name={name}
              value={value}
              setValue={setValue}
              icon={icon}
            />
          )
        );
      case "select":
        return (
          !isHidden &&
          options && (
            <Select
              label={label}
              icon={icon}
              required={required}
              disabled={disabled}
              options={options}
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );
      default:
        return null;
    }
  };

  return <div className="flex w-full">{getFormComponent()}</div>;
};

export default FormElement;
