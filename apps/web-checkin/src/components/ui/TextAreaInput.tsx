import React, { useState } from "react";

interface TextAreaInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative mt-2">
      <label className="text-base font-medium text-[#111111] block mb-3">
        {label}
        {required && <span className="text-zostel-common-error ml-1">*</span>}
      </label>
      <div
        className={`relative border-0 rounded-xl bg-gray-100 ${
          isFocused ? "ring-2 ring-gray-300" : ""
        }`}
      >
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full px-4 py-4 bg-transparent rounded-xl focus:outline-none h-24 resize-none text-[#111111]"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default TextAreaInput;
