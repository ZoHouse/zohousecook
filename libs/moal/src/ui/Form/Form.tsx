/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import React from "react";
import FormElement, {
  FormElement as FormElementType,
} from "../FormElement/FormElement";

interface FormProps {
  formFields: FormElementType[];
  handleChange: (name: string, type: string, value: any) => void;
  getFormValue: (formData: GeneralObject, key: string, alias?: string) => any;
  formData: GeneralObject;
  className?: string;
  onClick?: () => void;
}

const Form: React.FC<FormProps> = ({
  formFields,
  getFormValue,
  formData,
  handleChange,
  className,
  onClick,
}) => {
  return (
    <form className={cn("flex flex-1 flex-col space-y-0.5 w-full", className)}>
      {formFields.map((dr) => {
        const isAllowedRender = dr.conditionallyRenderField
          ? dr.conditionallyRenderField(formData)
          : true;

        return (
          isAllowedRender &&
          !dr.isHidden && (
            <div
              onClick={onClick}
              className="flex flex-col w-full"
              key={dr.name}
            >
              <FormElement
                {...dr}
                hideLabel
                value={getFormValue(formData, dr.name, dr.alias)}
                setValue={handleChange.bind(null, dr.name, dr.type)}
              />
              {dr.hint && <span className="text-xs text-zui-silver my-1 ml-2">{dr.hint}</span>}
            </div>
          )
        );
      })}
    </form>
  );
};

export default Form;
