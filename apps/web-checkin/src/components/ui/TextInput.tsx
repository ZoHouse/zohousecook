import React, { useState } from "react";

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  onBlur?: () => void;
  required?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  value,
  onChange,
  autoComplete = "off",
  onBlur,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <div
        className={`h-14 relative border-0 rounded-xl bg-gray-100 ${
          isFocused ? "ring-2 ring-gray-300" : ""
        }`}
      >
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          autoComplete={autoComplete}
          className="block w-full px-4 pt-6 pb-2 bg-transparent rounded-xl focus:outline-none text-[#111111]"
        />
        <label
          htmlFor={id}
          className={`absolute transition-all duration-200 left-4 ${
            isFocused || hasValue
              ? "top-2 text-xs text-[#111111]/50"
              : "top-[18px] text-sm text-[#111111]/50"
          }`}
        >
          {label}
          {required && <span className="text-zostel-common-error ml-1">*</span>}
        </label>
      </div>
    </div>
  );
};

export default TextInput;
