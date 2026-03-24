import { CountryCode, isPossibleNumber, parsePhoneNumber } from "libphonenumber-js";

export const humanizeNumbers: (
  number: number,
  hideDecimal?: boolean,
  compact?: boolean,
  decimalPlaces?: number
) => string = (number, hideDecimal, compact, decimalPlaces = 2) => {
  let divisor = 1;
  let identifier = "";
  if (number >= 1000 && number < 100000) {
    divisor = 1000;
    identifier = "K";
  } else if (number >= 100000 && number < 10000000) {
    divisor = 100000;
    identifier = "L";
  } else if (number >= 10000000) {
    divisor = 10000000;
    identifier = "Cr";
  }

  const _n = compact ? number / divisor : number;
  const suffix = compact ? " " + identifier : "";
  const maximumFractionDigits = hideDecimal ? 0 : decimalPlaces;

  return Number(_n).toLocaleString("en-IN", { maximumFractionDigits }) + suffix;
};

export const isValidNumber = (value: unknown): boolean =>
  typeof value === "number" && !isNaN(value);

export const isValidPhoneNumber = (
  value: unknown,
  countryCode: CountryCode = "IN"
): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  const phoneNumber = `+${value}`;
  return isPossibleNumber(phoneNumber, countryCode);
};

export const formatPhoneNumber = (phoneNumber: string): string | null => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    const intlCode = match[1] ? "+1 " : "";
    return `${intlCode}(${match[2]}) ${match[3]}-${match[4]}`;
  }
  return null;
};

export const seperateCountryCodeandPhoneNumber = (
  phoneNumber: string
): { countryCode: string; phoneNumber: string } => {
  try {
    const parsedNumber = parsePhoneNumber(phoneNumber);
    if (parsedNumber) {
      return {
        countryCode: parsedNumber.countryCallingCode,
        phoneNumber: parsedNumber.nationalNumber,
      };
    }
  } catch (error) {
    console.error("Error parsing phone number:", error);
  }
  return { countryCode: "", phoneNumber: "" };
};
