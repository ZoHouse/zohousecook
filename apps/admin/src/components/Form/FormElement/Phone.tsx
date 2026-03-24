import { isValidString } from "@zo/utils/string";
import { Input, Select, Space } from "antd";
import countryCodes from "apps/admin/src/config/countryCodes";
import React, { useEffect, useState } from "react";

interface PhoneInputProps {
  setValue: (value: string) => void;
  size?: "small" | "middle" | "large";
  disabled?: boolean;
  placeholder?: string;
  value?: string;
}

interface CountryCode {
  symbol: string;
  phoneCode: string;
  country: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  disabled,
  value,
  setValue,
  placeholder,
  size,
}) => {
  const [internalValue, setInternalValue] = useState<{
    countryCode: string;
    phoneNumber: string;
  }>({ countryCode: "+1", phoneNumber: "" });

  // Handle external value changes
  useEffect(() => {
    if (!value) {
      setInternalValue({ countryCode: "+1", phoneNumber: "" });
      return;
    }

    const parsed = parsePhoneNumberIntoCountryCodeAndPhoneNumber(value);
    if (parsed) {
      const combinedNewValue = `${parsed.countryCode}${parsed.phoneNumber}`;
      if (combinedNewValue !== value) {
        setValue(combinedNewValue);
      } else {
        setInternalValue(parsed);
      }
    }
  }, [value, setValue]);

  const handleCountryCodeChange = (newCode: string) => {
    const newValue = { ...internalValue, countryCode: newCode };
    setInternalValue(newValue);
    setValue(`${newValue.countryCode}${newValue.phoneNumber}`);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = { ...internalValue, phoneNumber: e.target.value };
    setInternalValue(newValue);
    setValue(`${newValue.countryCode}${newValue.phoneNumber}`);
  };

  return (
    <Space.Compact size={size} style={{ width: "100%" }}>
      <Select
        disabled={disabled}
        size={size}
        defaultValue="+1"
        value={internalValue.countryCode}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        onChange={handleCountryCodeChange}
        options={countryCodes.map((country: CountryCode) => ({
          label: `${country.country} ${country.phoneCode}`,
          value: country.phoneCode,
          key: `${country.country}-${country.phoneCode}`,
        }))}
        style={{ width: "40%" }}
        dropdownStyle={{ minWidth: "200px" }}
        popupMatchSelectWidth={false}
      />
      <Input
        value={internalValue.phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder || "Enter phone number"}
        type="number"
        style={{ width: "100%" }}
        maxLength={15}
      />
    </Space.Compact>
  );
};

export const parsePhoneNumberIntoCountryCodeAndPhoneNumber = (
  phoneString: string
): { countryCode: string; phoneNumber: string } | null => {
  if (!isValidString(phoneString)) {
    return {
      countryCode: "+91",
      phoneNumber: "",
    };
  }
  // Remove all spaces and any characters that aren't numbers or plus sign
  const cleanNumber = phoneString.replace(/[^\d+]/g, "");

  // If number starts with +, remove it for processing
  const numberToProcess = cleanNumber.startsWith("+")
    ? cleanNumber.slice(1)
    : cleanNumber;

  // Find the country code by checking against valid codes
  const matchingCode = countryCodes
    .map((code) => code.phoneCode.replace("+", "")) // Remove + from codes
    .sort((a, b) => b.length - a.length) // Sort by length descending to match longest codes first
    .find((code) => numberToProcess.startsWith(code));

  if (!matchingCode) {
    return null;
  }

  return {
    countryCode: `+${matchingCode}`,
    phoneNumber: numberToProcess.slice(matchingCode.length),
  };
};

export default PhoneInput;
