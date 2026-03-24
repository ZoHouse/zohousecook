/* eslint-disable @typescript-eslint/no-explicit-any */

import { PlusOutlined } from "@ant-design/icons";
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Select, Tag } from "antd";
import { debounce } from "lodash";
import React, { KeyboardEvent, useRef, useState } from "react";

interface CreateableMultiSelectProps {
  value?: string[];
  setValue: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  options?: Array<{
    label: string | React.ReactNode;
    value: string;
  }>;
  onCreate?: (newValue: string) => Promise<void> | void;
  allowCreate?: boolean;
  createLabel?: string;
  maxCount?: number;
  className?: string;
  separators?: string[]; // Characters that trigger creation (default: [',', 'Enter'])
  // Search functionality props
  searchQueryApi?: QueryEndpoints;
  responseFields?: string[];
  optionRender?: (data: GeneralObject) => React.ReactNode;
  optionValueAndLabelSelector?: (data: GeneralObject) => {
    value: string;
    label: string | React.ReactNode;
  };
  customSearchQuery?: string;
  notFoundContent?: React.ReactNode;
}

const CreateableMultiSelect: React.FC<CreateableMultiSelectProps> = ({
  value = [],
  setValue,
  placeholder = "Type and press Enter or comma to add",
  disabled = false,
  size = "middle",
  options = [],
  onCreate,
  allowCreate = true,
  createLabel = "Create",
  maxCount,
  className,
  separators = [",", "Enter"],
  // Search props
  searchQueryApi,
  responseFields,
  optionRender,
  optionValueAndLabelSelector,
  customSearchQuery,
  notFoundContent,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const inputRef = useRef<any>(null);

  // Search API hook
  const { refetch: searchRefetch, isLoading: isSearchLoading } = useQueryApi(
    searchQueryApi || ("" as any),
    {
      enabled: false,
    },
    "",
    `search=${query}${
      responseFields?.length ? `&fields=${responseFields.join(",")}` : ""
    }${customSearchQuery ? `&${customSearchQuery}` : ""}`
  );

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((searchQuery: string) => {
      if (searchQuery.length > 1 && searchQueryApi) {
        searchRefetch()
          .then((res) => {
            setSearchResults(res.data?.data?.results || []);
          })
          .catch((e) => {
            console.error("Search error:", e);
            setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 300)
  ).current;

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];

  // Combine provided options, search results, and already selected values
  const allOptions = [
    ...(options || []),
    // Add search results if available
    ...(searchResults?.length > 0
      ? searchResults.map((d) =>
          optionValueAndLabelSelector
            ? optionValueAndLabelSelector(d)
            : {
                value: d?.id || d?.slug || d?.value,
                label: d?.name || d?.label || d?.slug,
              }
        )
      : []),
    // Add already selected values that might not be in options or search results
    ...safeValue
      .filter(
        (v) =>
          !options?.some((opt) => opt.value === v) &&
          !searchResults?.some(
            (result) =>
              (optionValueAndLabelSelector
                ? optionValueAndLabelSelector(result).value
                : result?.id || result?.slug || result?.value) === v
          )
      )
      .map((v) => ({ label: v, value: v })),
  ];

  const handleInputKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    const currentValue = inputValue.trim();

    if (!currentValue) return;

    const shouldCreate =
      e.key === "Enter" ||
      (e.key === "," && separators.includes(",")) ||
      separators.includes(e.key);

    if (shouldCreate) {
      e.preventDefault();
      await createNewOption(currentValue);
    }
  };

  const createNewOption = async (newValue: string) => {
    if (!newValue || safeValue.includes(newValue)) return;

    if (maxCount && safeValue.length >= maxCount) return;

    setIsCreating(true);

    try {
      // Call onCreate callback if provided
      if (onCreate) {
        await onCreate(newValue);
      }

      // Add to selected values
      const newValues = [...safeValue, newValue];
      setValue(newValues);
      setInputValue("");

      // Focus back to input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Error creating option:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSearch = (searchValue: string) => {
    setInputValue(searchValue);
    setQuery(searchValue);

    // Trigger search API call
    debouncedSearch(searchValue);

    // Handle pasted content with separators
    if (allowCreate && searchValue.includes(",")) {
      const values = searchValue
        .split(/[,\n\t]/)
        .map((v) => v.trim())
        .filter((v) => v && !safeValue.includes(v));

      if (values.length > 1) {
        values.forEach(async (val) => {
          if (maxCount && safeValue.length >= maxCount) return;
          await createNewOption(val);
        });
        setInputValue("");
        return;
      }
    }
  };

  const handleChange = (newValue: string[]) => {
    setValue(newValue);
  };

  const dropdownRender = (menu: React.ReactElement) => (
    <>
      {menu}
      {allowCreate &&
        inputValue &&
        !allOptions.some((opt) => opt.value === inputValue) && (
          <div
            style={{
              padding: "8px",
              borderTop: "1px solid #f0f0f0",
              cursor: "pointer",
            }}
            onClick={() => createNewOption(inputValue)}
          >
            <Tag
              icon={<PlusOutlined />}
              style={{
                borderStyle: "dashed",
                background: "transparent",
              }}
            >
              {createLabel} "{inputValue}"
            </Tag>
          </div>
        )}
    </>
  );

  return (
    <Select
      ref={inputRef}
      mode="multiple"
      size={size}
      value={safeValue}
      onChange={handleChange}
      onSearch={handleSearch}
      onInputKeyDown={handleInputKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      loading={isCreating || isSearchLoading}
      filterOption={
        searchQueryApi
          ? false
          : (input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
      }
      options={allOptions}
      dropdownRender={dropdownRender}
      maxCount={maxCount}
      searchValue={inputValue}
      autoClearSearchValue={false}
      showSearch
      optionFilterProp="label"
      optionRender={optionRender}
      notFoundContent={!isSearchLoading && (notFoundContent || null)}
    />
  );
};

export default CreateableMultiSelect;
