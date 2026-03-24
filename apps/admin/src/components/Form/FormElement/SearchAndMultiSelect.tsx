/* eslint-disable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @nx/enforce-module-boundaries
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";

import { Select, SelectProps } from "antd";
import { debounce } from "lodash";
import React, { useRef, useState } from "react";

interface SearchAndMultiSelectProps {
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
}

const SearchAndMultiSelect: React.FC<SearchAndMultiSelectProps> = ({
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
    setValue(selectedValue);
  };

  return (
    <Select
      size={size}
      mode="multiple"
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

export default React.memo(SearchAndMultiSelect);
