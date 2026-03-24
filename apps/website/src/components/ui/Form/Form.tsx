import { GeneralObject } from "@zo/definitions/general";
import React from "react";
import FormElement, {
  FormElement as FormElementType,
} from "../FormElement/FormElement";

interface FormProps {
  formFields: FormElementType[];
  handleChange: (name: string, type: string, value: any) => void;
  getFormValue: (formData: GeneralObject, key: string, alias?: string) => any;
  formData: GeneralObject;
}

const Form: React.FC<FormProps> = ({
  formFields,
  getFormValue,
  formData,
  handleChange,
}) => {
  return (
    <form className="flex flex-1 flex-col space-y-0.5 w-full">
      {formFields.map((dr) => {
        return (
          !dr.isHidden && (
            <div className="flex flex-col w-full" key={dr.name}>
              <FormElement
                {...dr}
                hideLabel
                className=""
                value={getFormValue(formData, dr.name, dr.alias)}
                setValue={handleChange.bind(null, dr.name, dr.type)}
              />
            </div>
          )
        );
      })}
    </form>
  );
};

export default Form;
