/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React from "react";
import ReactOtpInput from "react-otp-input";
import "../styles.css";

interface OtpInputProps {
  value: string;
  setter: React.Dispatch<any>;
  numInputs?: number;
  separator?: React.ReactNode;
  inputClass?: string;
  className?: string;
}

const OtpInput: React.FC<OtpInputProps> = ({
  value,
  setter,
  numInputs = 6,
  separator = <div className="w-2" />,
  inputClass = "otp-input",
  className = "",
}) => {
  return (
    <div className={`otp-container ${className}`}>
      <ReactOtpInput
        value={value}
        onChange={setter}
        inputType="number"
        numInputs={numInputs}
        renderSeparator={separator}
        inputStyle={cn(inputClass, "a")}
        renderInput={(props) => <input {...props} />}
      />
    </div>
  );
};

export default OtpInput;
