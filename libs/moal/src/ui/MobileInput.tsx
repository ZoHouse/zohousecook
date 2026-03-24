/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import "../styles.css";

interface MobileInputProps {
  className?: string;
  setter: React.Dispatch<any>;
  value: any;
  disabled?: boolean;
  inputClass?: string;
  onEnterKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const MobileInput: React.FC<MobileInputProps> = ({
  className,
  setter,
  value,
  disabled,
  inputClass,
  onEnterKeyPress,
}) => {
  return (
    <div className={` ${className ? className : ""}`}>
      <PhoneInput
        country={"in"}
        value={value}
        onChange={setter}
        placeholder="+91 00000-00000"
        searchPlaceholder="Search country"
        onEnterKeyPress={onEnterKeyPress}
        containerClass="phone-input-container"
        inputClass={inputClass || "phone-input"}
        buttonClass="phone-button"
        dropdownClass="phone-dropdown"
        enableSearch={true}
        disabled={disabled}
      />
    </div>
  );
};

export default MobileInput;
