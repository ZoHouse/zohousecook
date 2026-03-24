import { Form, FormInstance } from "antd";
import { useEffect, useState } from "react";
import { isEqual } from "lodash";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { FormElementType } from "@zo/moal";
import { GeneralObject } from "@zo/definitions/general";

export const useFormValidation = (
  form: FormInstance,
  formFields: FormElementType[],
  initialValues?: GeneralObject
): { hasFormDataChanged: boolean; areAllRequiredFieldsPresent: boolean } => {
  const [hasFormDataChanged, setHasFormDataChanged] = useState<boolean>(false);
  const [areAllRequiredFieldsPresent, setAreAllRequiredFieldsPresent] =
    useState<boolean>(false);

  // Watch all form values
  const values = Form.useWatch([], form);

  useEffect(() => {
    // Check for form data changes
    const currentValues = form.getFieldsValue();
    const hasChanged = !isEqual(currentValues, initialValues);

    setHasFormDataChanged(hasChanged);

    // Check required fields
    const requiredFields = formFields
      .filter((field) => field.required)
      .map((field) => field.name);

    const hasAllRequiredFields = requiredFields.every((fieldName) => {
      const value = currentValues[fieldName];
      return value !== undefined && value !== null && value !== "";
    });

    setAreAllRequiredFieldsPresent(hasAllRequiredFields);
  }, [form, values, initialValues, formFields]);

  return { hasFormDataChanged, areAllRequiredFieldsPresent };
};

export default useFormValidation;