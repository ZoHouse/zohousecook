/* eslint-disable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @nx/enforce-module-boundaries

import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Select } from "antd";
import { debounce } from "lodash";
import React, { useRef, useState } from "react";
interface SelectProps {
  value: any;
  setValue: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchQueryApi: QueryEndpoints;
  responseFields?: string[];
  size?: "small" | "middle" | "large";
  labelRender?: (
    props: GeneralObject
  ) => SelectProps["labelRender"] | undefined;
  notFoundContent?: React.ReactNode;
  optionRender?: (data: GeneralObject) => React.ReactNode;
  optionValueAndLabelSelector?: (data: GeneralObject) => {
    value: string;
    label: string | React.ReactNode;
  };
  options?: {
    label: string | React.ReactNode;
    value: string;
  }[];
  customSearchQuery?: string;
  selectedValueSelector?: (data: GeneralObject) => string;
}

const SearchSelect: React.FC<SelectProps> = ({
  value,
  setValue,
  placeholder,
  disabled,
  searchQueryApi,
  responseFields,
  size,
  labelRender,
  optionRender,
  notFoundContent,
  optionValueAndLabelSelector,
  options,
  customSearchQuery,
  selectedValueSelector,
}) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<GeneralObject[]>([]);

  const { refetch, isLoading } = useQueryApi(
    searchQueryApi,
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
    debounce((query: string) => {
      if (query.length > 1) {
        refetch()
          .then((res) => {
            setResults(res.data?.data?.results);
          })
          .catch((e) => {
            console.error("Search error:", e);
          });
      } else {
        setResults([]);
      }
    }, 300)
  ).current;

  const handleSearch = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleChange = (selectedValue: string) => {
    // Find the full data object for the selected value
    const selectedData = results.find((item) => {
      const option = optionValueAndLabelSelector
        ? optionValueAndLabelSelector(item)
        : { value: item.id };
      return option.value === selectedValue;
    });

    if (selectedValueSelector && selectedData) {
      // Call selectedValueSelector to process the data and get the value to store
      const processedValue = selectedValueSelector(selectedData);
      setValue(processedValue);
    } else {
      // Fallback to just the selected value
      setValue(selectedValue);
    }
  };

  return (
    <Select
      size={size}
      loading={isLoading}
      showSearch
      value={value}
      placeholder={placeholder}
      defaultActiveFirstOption={false}
      disabled={disabled}
      onChange={handleChange}
      filterOption={false}
      onSearch={handleSearch}
      notFoundContent={!isLoading && (notFoundContent || null)}
      optionRender={optionRender}
      options={
        results?.length > 0
          ? results.map((d) =>
              optionValueAndLabelSelector
                ? optionValueAndLabelSelector(d)
                : {
                    value: d?.id,
                    label: d?.name,
                  }
            )
          : options
      }
    />
  );
};

export default React.memo(SearchSelect);
