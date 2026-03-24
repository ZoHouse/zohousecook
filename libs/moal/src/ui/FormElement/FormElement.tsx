/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryEndpoints } from "@zo/auth";
import { Currency } from "@zo/definitions/admin";
import { GeneralObject } from "@zo/definitions/general";
import React from "react";
import Checkbox from "./Checkbox";
import ColourPicker from "./ColourPicker";
import Coordinates from "./Coordinates";
import DateInput from "./DateInput";
import DatetimeInput from "./DatetimeInput";
import EmojiPicker from "./EmojiPicker";
import FileUpload, { AllowedFileType } from "./FileUpload";
import Input from "./Input";
import JsonInput from "./JsonInput";
import MediaLinkGenerator from "./MediaLinkGenerator";
import MediaUpload from "./MediaUpload";
import MultiSelect from "./MultiSelect";
import NumberSpinner from "./NumberSpinner";
import Phone from "./Phone";
import Price from "./Price";
import Radio from "./Radio";
import SearchAndMultiSelect from "./SearchAndMultiSelect";
import SearchSelect from "./SearchSelect";
import Select from "./Select";
import TextCheckbox from "./TextCheckbox";
import Textarea from "./Textarea";
import TimeInput from "./TimeInput";
import SwitchToggle from "./SwitchToggle";

export type FormElementType =
  | "checkbox" // ✅
  | "textcheckbox" // ✅
  | "date" // ✅
  | "datetime" // ✅
  | "file"
  | "text" // ✅
  | "number" // ✅
  | "email" // ✅
  | "media"
  | "spinner" // ✅
  | "radio" // ✅
  | "searchselect" // ✅
  | "select" // ✅
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
  | "switch"; // ✅

export type FormElement = Omit<FormElementProps, "value" | "setValue">;

export interface FormElementProps {
  className?: string;
  name: string;
  alias?: string;
  label: string;
  type: FormElementType;
  disabledOnEdit?: boolean;
  initialValue?: any;
  placeholder?: string;
  multiSelect?: boolean;
  submitKeySelector?: (value: any) => any;
  searchQueryApi?: QueryEndpoints;
  searchQueryKeyIdentifier?: string;
  searchQueryResultRenderer?: (result: any) => JSX.Element;
  options?: Array<{ label: string; value: string; hint?: string }>;
  hideLabel?: boolean;
  value: any;
  setValue: React.Dispatch<any>;
  mediaKey?: string;
  labelTopAligned?: boolean;
  labelWidthClass?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  isHidden?: boolean;
  minValue?: number;
  maxValue?: number;
  steps?: number;
  mediakey?: string;
  allowedFileTypes?: AllowedFileType[];
  currency?: Currency;
  dataSelector?: (field: any, data: any) => any;
  selectedValueSelector?: (data: GeneralObject) => string;
  countryCode?: string;
  emptyListComponent?: React.ReactElement | null;
  userMessage?: React.ReactNode | null;
  conditionallyRenderField?: (formData: GeneralObject) => boolean;
  responseFields?: string[];
  /**
   * switchToggleOptions the first element represents true.
   */
  switchToggleOptions?: [
    { label: string; value: string },
    { label: string; value: string }
  ];
}

const FormElement: React.FC<FormElementProps> = ({
  name,
  className,
  type,
  value,
  required,
  placeholder,
  options,
  label,
  disabled,
  setValue,
  searchQueryApi,
  searchQueryResultRenderer,
  initialValue,
  isHidden,
  children,
  maxValue,
  minValue,
  steps = 1,
  mediaKey,
  allowedFileTypes,
  currency,
  selectedValueSelector,
  countryCode,
  emptyListComponent,
  userMessage,
  responseFields,
  switchToggleOptions,
}) => {
  const getFormComponent = () => {
    switch (type) {
      case "text":
      case "number":
      case "email":
        return (
          !isHidden && (
            <Input
              label={label}
              type={type}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
              min={minValue}
              max={maxValue}
              userMessage={userMessage}
            />
          )
        );
      case "textarea":
        return (
          !isHidden && (
            <Textarea
              label={label}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );
      case "select":
        return (
          !isHidden && (
            <Select
              label={label}
              options={options}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
              searchQueryResultRenderer={searchQueryResultRenderer}
            />
          )
        );
      case "searchselect":
        return (
          !isHidden &&
          searchQueryApi && (
            <SearchSelect
              label={label}
              searchQueryApi={searchQueryApi}
              searchQueryResultRenderer={searchQueryResultRenderer}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
              selectedValueSelector={selectedValueSelector}
              emptyListComponent={emptyListComponent}
              responseFields={responseFields}
            />
          )
        );
      case "checkbox":
        return (
          !isHidden &&
          options && (
            <Checkbox
              label={label}
              required={required}
              disabled={disabled}
              options={options}
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );
      case "radio":
        return (
          !isHidden &&
          options && (
            <Radio
              label={label}
              required={required}
              disabled={disabled}
              options={options}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
            />
          )
        );
      case "textcheckbox":
        return (
          !isHidden && (
            <TextCheckbox
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
            />
          )
        );
      case "date":
        return (
          !isHidden && (
            <DateInput
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
            />
          )
        );
      case "datetime":
        return (
          !isHidden && (
            <DatetimeInput
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
            />
          )
        );
      case "time":
        return (
          !isHidden && (
            <TimeInput
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
            />
          )
        );
      case "spinner":
        return (
          !isHidden && (
            <NumberSpinner
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              minValue={minValue}
              maxValue={maxValue}
              steps={steps}
              options={options}
            />
          )
        );
      case "media":
        return (
          !isHidden && (
            <MediaUpload
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              mediaKey={mediaKey}
            />
          )
        );
      case "colourPicker":
        return (
          !isHidden && (
            <ColourPicker
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              initialValue={initialValue}
              setValue={setValue}
            />
          )
        );
      case "mediaLinkGenerator":
        return (
          !isHidden && (
            <MediaLinkGenerator
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );
      case "file":
        return (
          !isHidden && (
            <FileUpload
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              allowedFileTypes={allowedFileTypes}
            />
          )
        );
      case "price":
        return (
          !isHidden && (
            <Price
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              currency={currency}
            />
          )
        );
      case "coordinates":
        return (
          !isHidden && (
            <Coordinates
              label={label}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
              min={minValue}
              max={maxValue}
            />
          )
        );
      case "phone":
        return (
          <Phone
            label={label}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            name={name}
            value={value}
            setValue={setValue}
            initialValue={initialValue}
            countryCode={countryCode}
          />
        );
      case "multiSelect":
        return (
          !isHidden &&
          options && (
            <MultiSelect
              label={label}
              required={required}
              disabled={disabled}
              options={options}
              name={name}
              value={value}
              setValue={setValue}
              initialValue={initialValue}
            />
          )
        );
      case "searchMultiSelect":
        return (
          !isHidden &&
          searchQueryApi && (
            <SearchAndMultiSelect
              label={label}
              searchQueryApi={searchQueryApi}
              searchQueryResultRenderer={searchQueryResultRenderer}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
              selectedValueSelector={selectedValueSelector}
              emptyListComponent={emptyListComponent}
              responseFields={responseFields}
            />
          )
        );
      case "emojiPicker":
        return (
          !isHidden && (
            <EmojiPicker
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              initialValue={initialValue}
              setValue={setValue}
            />
          )
        );
      case "jsonInput":
        return (
          !isHidden && (
            <JsonInput
              label={label}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );
      case "switch":
        return (
          !isHidden &&
          switchToggleOptions && (
            <SwitchToggle
              label={label}
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              setValue={setValue}
              options={switchToggleOptions}
              initialValue={initialValue}
            />
          )
        );
      case "custom":
        return <div>{children}</div>;
      default:
        return null;
    }
  };

  return <div className={`${className} flex w-full`}>{getFormComponent()}</div>;
};

export default FormElement;
