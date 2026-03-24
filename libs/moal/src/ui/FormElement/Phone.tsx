/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React, { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";

interface PhoneProps {
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  countryCode?: string;
}

const Phone: React.FC<PhoneProps> = ({
  setValue,
  value,
  label,
  name,
  disabled,
  initialValue,
  placeholder,
  required,
  countryCode,
}) => {
  const [ipBasedCountry, setIpBasedCountry] = useState<string>("in");

  useEffect(() => {
    // Fetch user's country based on IP
    const fetchCountryFromIP = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.country_code) {
          setIpBasedCountry(data.country_code.toLowerCase());
        }
      } catch (error) {
        console.error("Error fetching country from IP:", error);
      }
    };

    fetchCountryFromIP();
  }, []);

  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col bg-zui-light relative justify-center w-full rounded-xl",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <PhoneInput
        country={countryCode || ipBasedCountry}
        value={value}
        onChange={setValue}
        placeholder={placeholder || "Phone Number"}
        searchPlaceholder="Search country"
        enableSearch={true}
        specialLabel={label}
        disabled={disabled}
        containerClass="w-full flex overflow-visible phone-form-element"
        inputClass="w-full border-none focus:outline-none"
        buttonClass="bg-zui-light ml-4"
        dropdownClass="bg-zui-light phone-dropdown"
      />
    </div>
  );
};

export default Phone;
