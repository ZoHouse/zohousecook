import React from 'react';

interface Option {
  id: string;
  icon?: React.ReactNode;
  value: string;
}

interface TextRadioButtonProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const TextRadioButton: React.FC<TextRadioButtonProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className="mt-4">
      <label className="text-base font-medium text-zostel-light-text-primary mb-3 block">
        {label}
        {required && <span className="text-zostel-common-error ml-1">*</span>}
      </label>
      <div className="flex flex-col space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-center justify-between py-2 px-1"
          >
            <div className="flex items-center">
              {option.icon && <span className="mr-2">{option.icon}</span>}
              <span className="text-zostel-light-text-primary">{option.value}</span>
            </div>
            <div
              className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                value === option.id
                  ? "border-zostel-light-text-primary bg-zostel-light-text-primary"
                  : "border-zostel-light-stroke-primary"
              }`}
              onClick={() => onChange(option.id)}
            >
              {value === option.id && (
                <div className="w-2 h-2 rounded-full bg-zostel-light-text-inverted"></div>
              )}
            </div>
            <input
              type="radio"
              name={label}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="hidden"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default TextRadioButton;
