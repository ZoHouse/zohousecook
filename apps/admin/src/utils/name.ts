type ValidationResult = { isValid: true } | { isValid: false; error: string };

export interface NameParts {
  firstName: string;
  middleName: string;
  lastName: string;
}

const NAME_VALIDATION_RULES = {
  MIN_PART_LENGTH: 2,
  PATTERN: /^[a-zA-Z\s]+$/,
} as const;

const NAME_ERRORS = {
  REQUIRED: "Full name is required",
  INVALID_CHARS: "Name should only contain letters and spaces",
  MIN_LENGTH: "Each name part should be at least 2 characters",
} as const;

export const validateFullName = (value?: string): ValidationResult => {
  if (!value?.trim()) {
    return { isValid: false, error: NAME_ERRORS.REQUIRED };
  }

  if (!NAME_VALIDATION_RULES.PATTERN.test(value)) {
    return { isValid: false, error: NAME_ERRORS.INVALID_CHARS };
  }

  const nameParts = value.trim().split(/\s+/);

  const invalidPart = nameParts.find(
    (part) => part.length < NAME_VALIDATION_RULES.MIN_PART_LENGTH
  );

  if (invalidPart) {
    return { isValid: false, error: NAME_ERRORS.MIN_LENGTH };
  }

  return { isValid: true };
};

export const splitFullName = (fullName: string): NameParts => {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts[parts.length - 1],
  };
};

export const formatName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map(
      (part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`
    )
    .join(" ");
