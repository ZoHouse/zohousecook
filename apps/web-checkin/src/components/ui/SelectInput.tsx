import React, { useState, useMemo } from "react";
import { useOutsideClick } from "@zo/utils/hooks";
interface Option {
  value: string | number;
  label: string;
}

interface SelectInputProps {
  id: string;
  label: string;
  value: string | number;
  options: Option[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectorRef = React.useRef<HTMLDivElement>(null);

  useOutsideClick(selectorRef, () => setIsOpen(false));

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={selectorRef} className="mt-2">
      <label className="text-base font-medium text-zostel-light-text-primary mb-3 block">
        {label}
        {required && <span className="text-zostel-common-error ml-1">*</span>}
      </label>
      <div className="relative">
        <div
          className="w-full h-14 border-0 p-4 bg-zostel-light-background-input rounded-xl text-zostel-light-text-primary cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zostel-light-text-secondary">
            <svg
              className={`fill-current h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="sticky top-0 bg-white p-2">
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zostel-light-stroke-primary"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="py-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-2 cursor-pointer hover:bg-zostel-light-background-input ${
                    value === option.value
                      ? "bg-zostel-light-background-input"
                      : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {option.label}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-2 text-zostel-light-text-secondary">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectInput;
