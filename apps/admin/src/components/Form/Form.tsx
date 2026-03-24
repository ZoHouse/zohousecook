/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, FormInstance } from "antd";
import React from "react";
import FormElement, {
  FormElement as FormElementType,
} from "./FormElement/FormElement";
import { GeneralObject } from "@zo/definitions/general";

interface FormProps {
  formFields: FormElementType[];
  formData: FormInstance<any>;
  className?: string;
  onClick?: () => void;
  size?: "small" | "middle" | "large";
  formStatus?: "error" | "warning" | "success" | "validating" | "validating";
  onValueChange?: (changedValues?: any, values?: any) => void;
  variant?: "outlined" | "borderless" | "filled";
  initialValues?: GeneralObject;
}

const FormWrapper: React.FC<FormProps> = ({
  formFields,
  formData,
  className,
  size = "large",
  formStatus,
  onValueChange,
  variant,
  initialValues,
}) => {
  return (
    <Form
      onValuesChange={onValueChange}
      form={formData}
      layout="vertical"
      className={className}
      variant={variant}
      initialValues={initialValues}
    >
      {formFields.map((dr) => {
        const isAllowedRender = dr.conditionallyRenderField
          ? dr.conditionallyRenderField(formData)
          : true;

        return (
          isAllowedRender &&
          !dr.isHidden && (
            <>
              <FormElement
                {...dr}
                key={dr.name}
                hideLabel
                value={formData.getFieldValue(dr.name)}
                setValue={formData.setFieldValue.bind(null, dr.name)}
                size={size}
              />
              {dr.userMessage}
            </>
          )
        );
      })}
    </Form>
  );
};

export default FormWrapper;
