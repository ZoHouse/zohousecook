import React from "react";

interface LabelledTextProps {
  label: string;
  text?: string;
  className?: string;
  labelClassname?: string;
  textClassname?: string;
  children?: React.ReactNode;
}

const LabelledText: React.FC<LabelledTextProps> = ({
  label,
  text,
  className = "",
  children,
  labelClassname = "",
  textClassname = "",
}) => {
  return (
    <div className={className}>
      <div
        className={`${
          labelClassname || "text-subtitle"
        } font-semibold text-sm capitalize`}
      >
        {label}
      </div>
      <div className={`${textClassname || "text-text font-bold"}`}>
        {text || children}
      </div>
    </div>
  );
};

export default LabelledText;
