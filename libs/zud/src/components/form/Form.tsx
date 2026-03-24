/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, FormInstance } from "antd";
import React from "react";
import FormElement from "./FormElement/FormElement";
import { FormFieldType } from "./definitions";

interface FormProps {
  formFields: FormFieldType[];
  formData: FormInstance<any>;
  className?: string;
  onClick?: () => void;
  size?: "small" | "middle" | "large";
  formStatus?: "error" | "warning" | "success" | "validating" | "validating";
  onValueChange?: (changedValues?: any, values?: any) => void;
  variant?: "outlined" | "borderless" | "filled";
  isEditing?: boolean;
}

const FormWrapper: React.FC<FormProps> = ({
  formFields,
  formData,
  className,
  size = "large",
  formStatus,
  onValueChange,
  variant,
  isEditing = false,
}) => {
  return (
    <Form
      onValuesChange={onValueChange}
      form={formData}
      layout="vertical"
      className={className}
      variant={variant}
    >
      {formFields.map((dr) => {
        const isAllowedRender = dr.conditionallyRenderField
          ? dr.conditionallyRenderField(formData)
          : true;

        const isDisabled = () => {
          if (dr.disabled) {
            return true;
          }
          if (isEditing && dr.disableOnEdit) {
            return true;
          }
          return false;
        };
        
        return (
          isAllowedRender &&
          !dr.isHidden && (
            <FormElement
              {...dr}
              key={dr.name}
              hideLabel
              value={formData.getFieldValue(dr.name)}
              setValue={formData.setFieldValue.bind(null, dr.name)}
              size={size}
              disabled={isDisabled()}
            />
          )
        );
      })}
    </Form>
  );
};

export default FormWrapper;
