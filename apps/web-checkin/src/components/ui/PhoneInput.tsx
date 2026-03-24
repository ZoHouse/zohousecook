import { parsePhoneNumber } from "libphonenumber-js";
import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { cn } from "@zo/utils/font";

// Shared styles to avoid repetition
const BORDER_STYLES = "border-2 border-dashed border-zostel-light-stroke-primary rounded-full";
const TEXT_BASE = "text-base font-normal";
const TEXT_SM = "text-sm font-normal";

interface PhoneInputProps {
  onChange: (value: string) => void;
  value: string;
  className?: string;
}

const PhoneNumberInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <input
    className={cn(
      BORDER_STYLES,
      "px-4 py-2.5 outline-none max-w-[200px] bg-transparent",
      TEXT_BASE,
      className
    )}
    {...props}
    ref={ref}
  />
));
PhoneNumberInput.displayName = "PhoneNumberInput";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange
}: CountrySelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedCallingCode = React.useMemo(
    () => RPNInput.getCountryCallingCode(selectedCountry),
    [selectedCountry]
  );

  const filteredCountries = React.useMemo(() => {
    if (!searchQuery.trim()) return countryList;

    const query = searchQuery.toLowerCase();
    return countryList.filter(({ label, value }) => {
      if (!value) return false;
      const countryCode = RPNInput.getCountryCallingCode(value);
      return (
        label.toLowerCase().includes(query) ||
        countryCode.includes(query) ||
        value.toLowerCase().includes(query)
      );
    });
  }, [countryList, searchQuery]);

  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    setFocusedIndex(filteredCountries.length > 0 ? 0 : -1);
  }, [filteredCountries]);

  React.useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current) {
      const options = dropdownRef.current.querySelectorAll('[role="option"]');
      options[focusedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedIndex]);

  const closeDropdown = React.useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setFocusedIndex(0);
  }, []);

  const selectCountry = React.useCallback((country: RPNInput.Country) => {
    onChange(country);
    closeDropdown();
  }, [onChange, closeDropdown]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case "Enter":
        e.preventDefault();
        const focusedCountry = filteredCountries[focusedIndex]?.value;
        if (focusedCountry) {
          selectCountry(focusedCountry);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex gap-2 items-center",
          BORDER_STYLES,
          "px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0"
        )}
        disabled={disabled}
        aria-label="Select country code"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <CountryFlag country={selectedCountry} countryName={selectedCountry} />
        <span className={cn(TEXT_BASE, "whitespace-nowrap")}>
          +{selectedCallingCode}
        </span>
        <svg
          className={cn(
            "w-3 h-3 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="absolute top-full left-0 w-72 bg-white shadow-xl rounded-lg mt-2 overflow-hidden z-50 border border-gray-200"
            onKeyDown={handleKeyDown}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2.5 z-10">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries or codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
                aria-label="Search countries"
              />
            </div>

            <div
              ref={dropdownRef}
              className="max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="Country list"
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map(({ value, label }, index) =>
                  value ? (
                    <CountryOption
                      key={value}
                      country={value}
                      countryName={label}
                      isSelected={value === selectedCountry}
                      isFocused={index === focusedIndex}
                      onSelect={() => selectCountry(value)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    />
                  ) : null
                )
              ) : (
                <div className="p-3 text-center text-gray-500 text-sm">
                  No countries found
                </div>
              )}
            </div>
          </div>

          <div
            className="fixed inset-0 z-40"
            onClick={closeDropdown}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
};

interface CountryOptionProps extends RPNInput.FlagProps {
  isSelected: boolean;
  isFocused: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

const CountryOption = ({
  country,
  countryName,
  isSelected,
  isFocused,
  onSelect,
  onMouseEnter
}: CountryOptionProps) => {
  const callingCode = React.useMemo(
    () => RPNInput.getCountryCallingCode(country),
    [country]
  );

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors w-full text-left",
        TEXT_SM,
        (isSelected || isFocused) && "bg-gray-100"
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <CountryFlag country={country} countryName={countryName} />
      <span className="flex-1">{countryName}</span>
      <span className="text-gray-500">+{callingCode}</span>
    </button>
  );
};

const CountryFlag = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="inline-flex items-center justify-center h-5 w-7 rounded-sm bg-gray-100 overflow-hidden flex-shrink-0">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <span className="w-full h-full bg-gray-200" />
      )}
    </span>
  );
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  onChange,
  value,
  className,
}) => {
  const phoneInputRef = React.useRef<React.ElementRef<typeof RPNInput.default>>(null);

  const phoneValue = React.useMemo(() => {
    if (!value || typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();

    // Handle "code number" format (e.g., "91 1234567890")
    const parts = trimmedValue.split(' ');
    if (parts.length >= 2) {
      const code = parts[0];
      const number = parts.slice(1).join('');
      return `+${code}${number}` as RPNInput.Value;
    }

    // Handle "codenumber" format (e.g., "911234567890")
    if (/^\d+$/.test(trimmedValue)) {
      return `+${trimmedValue}` as RPNInput.Value;
    }

    // Handle "+911234567890" format
    if (trimmedValue.startsWith('+')) {
      return trimmedValue as RPNInput.Value;
    }

    return undefined;
  }, [value]);

  const updatePhoneNumber = React.useCallback((newValue: RPNInput.Value) => {
    if (!newValue) {
      onChange('');
      return;
    }

    const phoneNumber = newValue.toString();

    if (!phoneNumber.startsWith('+')) {
      onChange(phoneNumber);
      return;
    }

    try {
      const parsed = parsePhoneNumber(phoneNumber);
      if (parsed) {
        const { countryCallingCode, nationalNumber } = parsed;
        onChange(`${countryCallingCode} ${nationalNumber}`);
        return;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to parse phone number:', phoneNumber, error);
      }
    }

    // Fallback if parsing fails
    const withoutPlus = phoneNumber.substring(1);
    onChange(withoutPlus);
  }, [onChange]);

  return (
    <div className={cn("flex items-center justify-center gap-2 relative w-fit mx-auto", className)}>
      <RPNInput.default
        ref={phoneInputRef}
        className="flex items-center gap-2 [&>div]:flex [&>div]:items-center [&>div]:gap-2"
        flagComponent={CountryFlag}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneNumberInput}
        defaultCountry="IN"
        value={phoneValue}
        onChange={updatePhoneNumber}
      />
    </div>
  );
};

export default PhoneInput;
