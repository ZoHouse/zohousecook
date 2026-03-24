import { GeneralObject } from "@zo/definitions/general";
import { FormElementType } from "@zo/moal";

const areRequiredFieldsPresent = (
  formFields: FormElementType[],
  formData: GeneralObject
): boolean => {
  const requiredKeys = formFields
    .filter((key) => key.required)
    .map((key) => key.name);
  // eslint-disable-next-line no-prototype-builtins
  return requiredKeys.every((key) => formData.hasOwnProperty(key));
};

export { areRequiredFieldsPresent };

