import Typo from "@zo/coal/typography";
import React from "react";

interface FormControlProps {
  label: string;
  hint?: string;
  type?: "custom";
  children?: React.ReactNode;
  rightActions?: React.ReactNode;
}

const FormControl: React.FC<FormControlProps> = ({
  label,
  hint,
  children,
  rightActions,
}) => {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-between items-center flex-shrink-0">
        <div className="flex flex-col">
          <label>
            <Typo type="subtitle">{label}</Typo>
          </label>
          <Typo type="tertiary" className="text-zui-silver">
            {hint}
          </Typo>
        </div>
        {rightActions}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
};

export default FormControl;
