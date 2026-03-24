import { GeneralObject } from "@zo/definitions/general";
import { isValidEmail, isValidString } from "@zo/utils/string";
import React, { useMemo, useState, useEffect } from "react";
import { Country, ProfileFields } from "../../config";
import {
  Button,
  SelectInput,
  TextAreaInput,
  TextInput,
  TextRadioButton,
} from "../ui";

interface PersonalInfoProps {
  formData: GeneralObject;
  countries: Country[];
  isLoading: boolean;
  mobileNumber: string;
  actionText: string;
  handleChange: (key: string, value: string | number) => void;
  onSubmit: () => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({
  countries,
  formData,
  isLoading,
  actionText,
  handleChange,
  onSubmit,
  mobileNumber,
}) => {
  const [validationErrors, setValidationErrors] = useState({
    first_name: "",
    last_name: "",
    email_address: "",
    date_of_birth: "",
    country: "",
    address: "",
    gender: "",
  });

  const [touchedFields, setTouchedFields] = useState({
    first_name: false,
    last_name: false,
    email_address: false,
    date_of_birth: false,
    country: false,
    address: false,
    gender: false,
  });

  // State to keep track of the display format of date
  const [displayDate, setDisplayDate] = useState("");

  // Update display date whenever formData.date_of_birth changes
  useEffect(() => {
    if (formData.date_of_birth) {
      setDisplayDate(formatDateForDisplay(formData.date_of_birth));
    } else {
      setDisplayDate("");
    }
  }, [formData.date_of_birth]);

  // Convert from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString || dateString === "") return "";

    // Check if it's already in the display format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Verify it's in YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return "";
    }

    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  // Convert from DD-MM-YYYY to YYYY-MM-DD
  const formatDateForStorage = (dateString: string): string => {
    if (!dateString || dateString === "") return "";

    // Check if it's already in storage format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Verify it's in DD-MM-YYYY format
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return "";
    }

    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  };

  // Validate a date in DD-MM-YYYY format
  const isValidDisplayDateFormat = (dateString: string): boolean => {
    // First check if it's in DD-MM-YYYY format
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return false;
    }

    const [day, month, year] = dateString.split("-");

    // Validate day, month, year
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Basic validation
    if (monthNum < 1 || monthNum > 12) return false;

    // Get days in the specific month
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) return false;

    // Check if date is not in the future
    const currentDate = new Date();
    const inputDate = new Date(yearNum, monthNum - 1, dayNum);
    if (inputDate > currentDate) return false;

    return true;
  };

  // Validate fields
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "first_name":
      case "last_name":
        return !isValidString(value)
          ? `${field === "first_name" ? "First" : "Last"} name is required`
          : "";
      case "email_address":
        if (!value) return "Email is required";
        if (!isValidEmail(value)) return "Please enter a valid email address";
        return "";
      case "gender":
        return !value ? "Gender is required" : "";
      case "country":
        return !value ? "Country is required" : "";
      case "address":
        return !isValidString(value) ? "Address is required" : "";
      case "date_of_birth":
        if (!value) return "Date of birth is required";
        // For date_of_birth, validate the display format since that's what user sees
        if (
          field === "date_of_birth" &&
          !isValidDisplayDateFormat(displayDate)
        ) {
          return "Please enter a valid date in DD-MM-YYYY format";
        }
        return "";
      default:
        return "";
    }
  };

  // Handle DOB input change
  const handleDOBChange = (value: string) => {
    setDisplayDate(value);

    // Only update the stored value if it's a valid date
    if (isValidDisplayDateFormat(value)) {
      const storageFormat = formatDateForStorage(value);
      handleChange("date_of_birth", storageFormat);
    } else if (value === "") {
      // If cleared, update the storage value
      handleChange("date_of_birth", "");
    }

    // Validate if field has been touched
    if (touchedFields.date_of_birth) {
      setValidationErrors((prev) => ({
        ...prev,
        date_of_birth: value
          ? isValidDisplayDateFormat(value)
            ? ""
            : "Please enter a valid date in DD-MM-YYYY format"
          : "Date of birth is required",
      }));
    }
  };

  // Handle regular input change for other fields
  const handleInputChange = (field: string, value: string) => {
    // Handle all fields except date_of_birth
    if (field !== "date_of_birth") {
      handleChange(field, value);

      if (touchedFields[field as keyof typeof touchedFields]) {
        setValidationErrors((prev) => ({
          ...prev,
          [field]: validateField(field, value),
        }));
      }
    }
  };

  // Handle input blur
  const handleInputBlur = (field: string) => {
    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Validate the field
    if (field === "date_of_birth") {
      setValidationErrors((prev) => ({
        ...prev,
        date_of_birth: displayDate
          ? isValidDisplayDateFormat(displayDate)
            ? ""
            : "Please enter a valid date in DD-MM-YYYY format"
          : "Date of birth is required",
      }));
    } else {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: validateField(field, formData[field] || ""),
      }));
    }
  };

  // Check if the form is valid
  const isFormValid = useMemo(() => {
    // Check if all required fields have values
    const requiredFields = [
      "first_name",
      "last_name",
      "email_address",
      "gender",
      "date_of_birth",
      "country",
      "address",
    ];

    const allFieldsHaveValues = requiredFields.every(
      (field) => formData[field] && formData[field].toString().trim() !== ""
    );

    // Check if there are no validation errors
    const noValidationErrors = Object.values(validationErrors).every(
      (error) => error === ""
    );

    return allFieldsHaveValues && noValidationErrors;
  }, [formData, validationErrors]);

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex flex-col space-y-6">
        {/* First Name */}
        <div className="relative">
          <TextInput
            id="first_name"
            label="First Name"
            value={formData["first_name"] || ""}
            onChange={(value) => handleInputChange("first_name", value)}
            onBlur={() => handleInputBlur("first_name")}
            required
          />
          {touchedFields.first_name && validationErrors.first_name && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.first_name}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div className="relative">
          <TextInput
            id="last_name"
            label="Last Name"
            value={formData["last_name"] || ""}
            onChange={(value) => handleInputChange("last_name", value)}
            onBlur={() => handleInputBlur("last_name")}
            required
          />
          {touchedFields.last_name && validationErrors.last_name && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.last_name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="relative">
          <TextInput
            id="email_address"
            label="Your email"
            value={formData["email_address"] || ""}
            onChange={(value) => handleInputChange("email_address", value)}
            onBlur={() => handleInputBlur("email_address")}
            required
          />
          {touchedFields.email_address && validationErrors.email_address && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.email_address}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="relative">
          <TextRadioButton
            label="Gender"
            options={ProfileFields.gender}
            value={formData["gender"] || ""}
            onChange={(value) => handleInputChange("gender", value)}
            required
          />
          {touchedFields.gender && validationErrors.gender && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.gender}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="relative">
          <TextInput
            id="date_of_birth"
            label="Date of Birth (DD-MM-YYYY)"
            value={displayDate}
            onChange={handleDOBChange}
            onBlur={() => handleInputBlur("date_of_birth")}
            required
          />
          {touchedFields.date_of_birth && validationErrors.date_of_birth && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.date_of_birth}
            </p>
          )}
        </div>

        {/* Home Country */}
        <div className="relative">
          <SelectInput
            id="country"
            label="Home Country"
            value={formData["country"] || ""}
            onChange={(value) => handleInputChange("country", String(value))}
            options={countries.map((country) => ({
              value: country.code,
              label: `${country.flag} ${country.name}`,
            }))}
            placeholder="Select your country"
            required
          />
          {touchedFields.country && validationErrors.country && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.country}
            </p>
          )}
        </div>

        {/* Permanent Address */}
        <div className="relative">
          <TextAreaInput
            id="address"
            label="Permanent Address"
            value={formData["address"] || ""}
            onChange={(value) => handleInputChange("address", value)}
            placeholder="Your complete address goes here"
            required
          />
          {touchedFields.address && validationErrors.address && (
            <p className="text-zostel-common-error text-sm mt-1 ml-2">
              {validationErrors.address}
            </p>
          )}
        </div>

        {/* Add an ID Button */}
        <Button
          size="default"
          isLoading={isLoading}
          onClick={onSubmit}
          disabled={isLoading || !isFormValid}
        >
          {actionText || "Add an ID"}
        </Button>
      </div>
    </div>
  );
};

export default PersonalInfo;
