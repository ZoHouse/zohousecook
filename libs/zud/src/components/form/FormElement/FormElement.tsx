/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import ColourPicker from "./ColourPicker";
import Coordinates from "./Coordinates";
import EmojiPicker from "./EmojiPicker";
import MediaLinkGenerator from "./MediaLinkGenerator";
import NumberSpinner from "./NumberSpinner";
import PhoneInput from "./Phone";
import SearchAndMultiSelect from "./SearchAndMultiSelect";
import SearchSelect from "./SearchSelect";
import MediaPicker from "./MediaPicker";

import { cn } from "@zo/utils/font";
import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  TimePicker,
} from "antd";
import { Rule } from "antd/es/form";
import TextArea from "antd/es/input/TextArea";
import moment from "moment";
import { FormElementInterface } from "../definitions";
import Price from "./Price";

const FormElement: React.FC<FormElementInterface> = ({
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
  currency,
  notFoundContent,
  responseFields,
  status,
  variant,
  size,
  addonAfter,
  addonBefore,
  optionValueAndLabelSelector,
  buttonVarient,
  maxInputLength,
  buttonVariant,
  rules,
  mediaKey,
  allowedFileTypes,
  maxSize,
  allowMultiple,
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
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              size={size}
              className={className}
              showSearch
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
              name={name}
              disabled={disabled}
              defaultChecked={
                typeof initialValue === "boolean" ? initialValue : false
              }
              checked={typeof value === "boolean" ? value : false}
              onChange={(e) => {
                setValue(e.target.checked);
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
              size={size}
              status={status}
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
              placeholder={placeholder}
              size={size}
              variant={variant}
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
      className="w-full"
      valuePropName={type === "checkbox" ? "checked" : "value"}
      //   validateTrigger={validateTrigger}
    >
      {getFormComponent()}
    </Form.Item>
  );
};

export default FormElement;
