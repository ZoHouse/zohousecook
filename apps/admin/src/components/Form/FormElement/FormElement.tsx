/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryEndpoints } from "@zo/auth";
import { Currency } from "@zo/definitions/admin";
import { GeneralObject } from "@zo/definitions/general";
import React, { useMemo } from "react";
import ColourPicker from "./ColourPicker";
import Coordinates from "./Coordinates";
import EmojiPicker from "./EmojiPicker";
import JsonInput from "./JsonInput";
import MediaLinkGenerator from "./MediaLinkGenerator";
import NumberSpinner from "./NumberSpinner";
import PhoneInput from "./Phone";
import SearchAndMultiSelect from "./SearchAndMultiSelect";
import SearchSelect from "./SearchSelect";
import SearchableCreateSelect from "./SearchableCreateSelect";

import { cn } from "@zo/utils/font";
import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  SelectProps,
  Switch,
  TimePicker,
} from "antd";
import { Rule } from "antd/es/form";
import TextArea from "antd/es/input/TextArea";
import { AllowedFileType } from "libs/moal/src/ui/FormElement/FileUpload";
import moment from "moment";
import MediaPicker from "./MediaPicker";
import Price from "./Price";

export type FormElementType =
  | "checkbox" // ✅
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
  | "switch"
  | "radiogroup"
  | "toggleSelector" // ✅
  | "searchableTagInput"; // ✅

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
  optionRender?: (result: any) => React.ReactNode;
  options?: Array<{
    label: string | React.ReactNode;
    value: string;
    hint?: string;
  }>;
  hideLabel?: boolean;
  value: any;
  setValue: (value: any) => void;
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
  notFoundContent?: React.ReactElement | null;
  userMessage?: React.ReactNode | null;
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
  /**
   * switchToggleOptions the first element represents true.
   */
  switchToggleOptions?: [
    { label: string; value: string },
    { label: string; value: string }
  ];

  optionValueAndLabelSelector?: (data: GeneralObject) => {
    value: string;
    label: string;
  };
  validateTrigger?: "onChange" | "onBlur" | "onSubmit";
  rules?: Rule[];
  customSearchQuery?: string;
  maxSize?: number;
  allowMultiple?: boolean;
  createMutationApi?: string;
  onTagCreated?: () => void;
  minDate?: Date;
  maxDate?: Date;
}

const verticalLabel = ["switch"];

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
  optionRender,
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
  notFoundContent,
  userMessage,
  responseFields,
  switchToggleOptions,
  alias,
  status,
  variant,
  size,
  labelRender,
  addonAfter,
  addonBefore,
  optionValueAndLabelSelector,
  buttonVarient,
  maxInputLength,
  buttonVariant,
  customSearchQuery,
  validateTrigger = "onBlur",
  rules,
  maxSize,
  allowMultiple,
  createMutationApi,
  onTagCreated,
  minDate,
  maxDate,
}) => {
  const formItemRule: Rule[] = useMemo(() => {
    const _rules: Rule[] = [];

    if (type === "email") {
      _rules.push({
        type: "email",
        message: "The input is not valid E-mail!",
      });
    }

    if (required) {
      _rules.push({
        required: true,
        message: "This field is required",
      });
    }

    if (rules) {
      _rules.push(...rules);
    }

    return _rules;
  }, [type, required, rules]);

  const getFormComponent = () => {
    switch (type) {
      case "text":
      case "email":
        return (
          !isHidden && (
            <Input
              status={status}
              variant={variant}
              type=""
              disabled={disabled}
              size={size}
              className={className}
              autoComplete="off"
              addonAfter={addonAfter}
              addonBefore={addonBefore}
              maxLength={maxInputLength}
            />
          )
        );

      case "number":
        return (
          !isHidden && (
            <InputNumber
              status={status}
              variant={variant}
              min={minValue}
              max={maxValue}
              disabled={disabled}
              size={size}
              className={cn("w-full", className)}
              addonAfter={addonAfter}
              addonBefore={addonBefore}
              type="number"
            />
          )
        );

      case "textarea":
        return (
          !isHidden && (
            <TextArea
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              name={name}
              value={value}
              size={size}
              className={className}
              showCount
              maxLength={maxInputLength}
              style={{ height: 160 }}
            />
          )
        );
      case "select":
        return (
          !isHidden && (
            <Select
              options={options || []}
              value={value || (options && options[0]?.value)}
              disabled={disabled}
              placeholder={placeholder}
              size={size}
              className={className}
              showSearch
              optionRender={optionRender}
            />
          )
        );
      case "multiSelect":
        return (
          !isHidden && (
            <Select
              options={options || []}
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              size={size}
              className={className}
              showSearch
              mode="multiple"
              optionFilterProp="label"
            />
          )
        );
      case "searchselect":
        return (
          !isHidden &&
          searchQueryApi && (
            <SearchSelect
              searchQueryApi={searchQueryApi}
              disabled={disabled}
              placeholder={placeholder}
              value={value}
              setValue={setValue}
              responseFields={responseFields}
              size={size}
              optionRender={optionRender}
              notFoundContent={notFoundContent}
              optionValueAndLabelSelector={optionValueAndLabelSelector}
              options={options}
              customSearchQuery={customSearchQuery}
              selectedValueSelector={selectedValueSelector}
            />
          )
        );
      case "radio":
        return (
          !isHidden &&
          options && (
            <Radio.Group
              options={options}
              value={value}
              disabled={disabled}
              size={size}
              buttonStyle={buttonVarient}
              defaultValue={initialValue}
            />
          )
        );
      case "radiogroup":
        return (
          !isHidden &&
          options && (
            <Radio.Group
              defaultValue="a"
              size={size}
              value={value}
              buttonStyle={buttonVarient}
            >
              {options.map((option) => (
                <Radio.Button key={option.value} value={option.value}>
                  {option.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          )
        );
      case "checkbox":
        return (
          !isHidden && (
            <Checkbox
              disabled={disabled}
              defaultChecked={initialValue}
              checked={value}
              onChange={(e) => {
                setValue?.(e.target.checked);
              }}
            >
              {label}
            </Checkbox>
          )
        );
      case "date":
        return (
          !isHidden && (
            <DatePicker
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              placeholder={placeholder}
              size={size}
              className={cn("w-full", className)}
              variant={variant}
              disabledDate={(current) => {
                let isDisabled = false;
                if (minDate && current && current.isBefore(minDate, "day")) {
                  isDisabled = true;
                }
                if (maxDate && current && current.isAfter(maxDate, "day")) {
                  isDisabled = true;
                }
                return isDisabled;
              }}
            />
          )
        );
      case "datetime":
        return (
          !isHidden && (
            <DatePicker
              required={required}
              disabled={disabled}
              name={name}
              value={value ? moment(value) : null}
              showTime
              placeholder={placeholder}
              size={size}
              className={cn("w-full", className)}
              variant={variant}
              disabledDate={(current) => {
                let isDisabled = false;
                if (minDate && current && current.isBefore(minDate, "day")) {
                  isDisabled = true;
                }
                if (maxDate && current && current.isAfter(maxDate, "day")) {
                  isDisabled = true;
                }
                return isDisabled;
              }}
            />
          )
        );
      case "time":
        return (
          !isHidden && (
            <TimePicker
              required={required}
              disabled={disabled}
              name={name}
              value={value}
              placeholder={placeholder}
              format="HH:mm:ss"
              className={cn("w-full", className)}
              variant={variant}
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
              size={size}
              variant={variant}
              buttonVariant={buttonVariant}
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
          !isHidden && (
            <PhoneInput
              setValue={setValue}
              disabled={disabled}
              value={value}
              placeholder={placeholder}
              size={size}
            />
          )
        );

      case "searchMultiSelect":
        return (
          !isHidden &&
          searchQueryApi && (
            <SearchAndMultiSelect
              searchQueryApi={searchQueryApi}
              disabled={disabled}
              placeholder={placeholder}
              value={value}
              setValue={setValue}
              notFoundContent={notFoundContent}
              responseFields={responseFields}
              options={options}
              optionValueAndLabelSelector={optionValueAndLabelSelector}
              optionRender={optionRender}
              size={size}
              customSearchQuery={customSearchQuery}
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
      case "switch":
        return (
          !isHidden &&
          switchToggleOptions && (
            <Switch
              checkedChildren={switchToggleOptions[0].label}
              unCheckedChildren={switchToggleOptions[1].label}
              defaultChecked={value}
              disabled={disabled}
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
              initialValue={initialValue}
              currency={currency}
              placeholder={placeholder}
              size={size}
              variant={variant}
              min={minValue}
              max={maxValue}
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
              name={name}
              value={value}
              setValue={setValue}
            />
          )
        );
      case "media":
        return (
          !isHidden && (
            <MediaPicker
              label={label}
              disabled={disabled}
              value={value}
              setValue={setValue}
              mediaKey={mediaKey}
              allowedFileTypes={allowedFileTypes}
              maxSize={maxSize}
              allowMultiple={allowMultiple}
              placeholder={placeholder}
            />
          )
        );
      case "toggleSelector":
        return (
          !isHidden && (
            <Switch
              checked={value}
              onChange={(checked) => setValue(checked)}
              disabled={disabled}
              defaultValue={initialValue}
            />
          )
        );
      case "searchableTagInput":
        return (
          !isHidden &&
          searchQueryApi &&
          createMutationApi && (
            <SearchableCreateSelect
              value={value || []}
              setValue={setValue}
              placeholder={placeholder}
              disabled={disabled}
              searchQueryApi={searchQueryApi}
              createMutationApi={createMutationApi as any}
              size={size}
              className={className}
              optionValueAndLabelSelector={optionValueAndLabelSelector}
              onItemCreated={onTagCreated}
            />
          )
        );
      case "custom":
        return <div>{children}</div>;
      default:
        return null;
    }
  };

  return (
    <Form.Item
      rules={formItemRule}
      name={name}
      required={required}
      label={label}
      className={"w-full"}
      validateTrigger={validateTrigger}
    >
      {getFormComponent()}
    </Form.Item>
  );
};

export default FormElement;
