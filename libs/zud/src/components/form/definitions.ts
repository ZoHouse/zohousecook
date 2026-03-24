/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @nx/enforce-module-boundaries
import { QueryEndpoints } from "@zo/auth";
import { Currency } from "@zo/definitions/admin";
import { GeneralObject } from "@zo/definitions/general";
import { Rule } from "antd/es/form";
import { SelectProps } from "antd/es/select";

export type AllowedFileType = "image" | "video" | "document" | "audio";

export type FormElementType =
  | "checkbox"
  | "date"
  | "datetime"
  | "file"
  | "text"
  | "number"
  | "email"
  | "media"
  | "spinner"
  | "radio"
  | "searchselect"
  | "select"
  | "textarea"
  | "custom"
  | "mediaLinkGenerator"
  | "colourPicker"
  | "time"
  | "price"
  | "coordinates"
  | "phone"
  | "multiSelect"
  | "searchMultiSelect"
  | "emojiPicker"
  | "jsonInput"
  | "radiogroup";

export interface FormElementInterface {
  className?: string;
  name: string;
  label: string;
  type: FormElementType;
  initialValue?: any;
  placeholder?: string;
  submitKeySelector?: (value: GeneralObject) => any;
  searchQueryApi?: QueryEndpoints;
  searchQueryKeyIdentifier?: string;
  optionRender?: (result: GeneralObject) => React.ReactNode;
  options?: Array<{ label: string; value: string; hint?: string }>;
  hideLabel?: boolean;
  value: any;
  setValue: (value: any) => void;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  isHidden?: boolean;
  minValue?: number;
  maxValue?: number;
  steps?: number;
  allowedFileTypes?: AllowedFileType[];
  currency?: Currency;
  dataSelector?: (field: any, data: any) => any;
  selectedValueSelector?: (data: GeneralObject) => string;
  countryCode?: string;
  notFoundContent?: React.ReactElement | null;
  conditionallyRenderField?: (formData: GeneralObject) => boolean;
  status?: "error" | "warning";
  responseFields?: string[];
  variant?: "outlined" | "borderless" | "filled";
  buttonVarient?: "outline" | "solid";
  size?: "small" | "middle" | "large";
  labelRender?: (props: GeneralObject) => SelectProps["labelRender"];
  addonAfter?: string;
  addonBefore?: string;
  maxInputLength?: number;
  buttonVariant?:
    | "filled"
    | "outlined"
    | "link"
    | "text"
    | "dashed"
    | "solid"
    | undefined;
  optionValueAndLabelSelector?: (data: GeneralObject) => {
    value: string;
    label: string | React.ReactNode;
  };
  validateTrigger?: "onChange" | "onBlur" | "onSubmit";
  rules?: Rule[];
  mediaKey?: string;
  maxSize?: number;
  allowMultiple?: boolean;
  disableOnEdit?: boolean;
}

export type FormFieldType = Omit<FormElementInterface, "value" | "setValue">;
