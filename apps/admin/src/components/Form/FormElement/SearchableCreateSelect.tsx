import { CheckOutlined, PlusOutlined } from "@ant-design/icons";
import {
  MutationEndpoints,
  QueryEndpoints,
  useMutationApi,
  useQueryApi,
} from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize } from "@zo/utils/string";
import { App, Button, Select } from "antd";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useState } from "react";

interface SearchableCreateSelectProps {
  value: string[];
  setValue: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  searchQueryApi: QueryEndpoints;
  createMutationApi: MutationEndpoints;
  size?: "small" | "middle" | "large";
  className?: string;
  optionValueAndLabelSelector?: (data: GeneralObject) => {
    value: string;
    label: string;
  };
  onItemCreated?: () => void;
  createFieldName?: string; // Field name for API (default: 'slug')
  itemType?: string; // For messages (default: 'item')
}

const SearchableCreateSelect: React.FC<SearchableCreateSelectProps> = ({
  value = [],
  setValue,
  placeholder = "Search items or create new ones (press Enter/comma)",
  disabled,
  searchQueryApi,
  createMutationApi,
  size = "large",
  className = "w-full",
  optionValueAndLabelSelector,
  onItemCreated,
  createFieldName = "slug",
  itemType = "item",
}) => {
  const { message } = App.useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [lastValidItems, setLastValidItems] = useState<string[]>([]);
  const [isCreatingInlineItem, setIsCreatingInlineItem] = useState(false);

  // API hooks
  const { mutate: createItem } = useMutationApi(
    createMutationApi,
    {},
    "",
    "POST"
  );

  const { data: searchData, isLoading: isSearching } = useQueryApi<any>(
    searchQueryApi,
    {
      enabled: searchQuery.trim().length > 1,
      refetchOnWindowFocus: false,
      select: (data) => {
        const results = data?.data?.results || [];
        return results;
      },
    },
    "",
    `search=${encodeURIComponent(searchQuery.trim())}&limit=10`
  );

  useEffect(() => {
    if (searchData && Array.isArray(searchData)) {
      const processedResults = searchData.map((tag: GeneralObject) => {
        const result = optionValueAndLabelSelector
          ? optionValueAndLabelSelector(tag)
          : {
              label: formatCapitalize(tag.slug || tag.name || tag.title),
              value: tag.slug || tag.id || tag.value,
            };
        return result;
      });

      setSearchResults(processedResults);
    } else {
      if (searchQuery.trim().length > 1) {
        setSearchResults([]);
      }
    }
  }, [searchData, optionValueAndLabelSelector, searchQuery]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 300),
    []
  );

  const handleSearch = (searchValue: string) => {
    const currentTags = value;

    if (!Array.isArray(currentTags)) {
      setValue(lastValidItems);
    }

    setInputValue(searchValue);

    if (searchValue.trim().length <= 1) {
      setSearchResults([]);
      setSearchQuery("");
      return;
    }

    debouncedSearch(searchValue);
  };

  const handleCreateInlineTag = async (tagName: string) => {
    const trimmedTag = tagName.toLowerCase().trim();
    if (!trimmedTag) return;

    const actualSelectedTags = Array.isArray(value)
      ? value.filter((tag) => tag && tag.trim())
      : [];

    if (actualSelectedTags.includes(trimmedTag)) {
      message.info(`"${trimmedTag}" already selected`);
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    setIsCreatingInlineItem(true);

    createItem(
      {
        data: {
          [createFieldName]: trimmedTag,
        },
        route: "",
      },
      {
        onSuccess: () => {
          message.success(`${itemType} "${trimmedTag}" created successfully!`);
          onItemCreated?.();

          const cleanTags = Array.isArray(value)
            ? value.filter((tag) => tag && tag.trim())
            : [];
          const newTags = [...cleanTags, trimmedTag];
          setValue(newTags);

          setSearchQuery("");
          setInputValue("");
          setSearchResults([]);
          setIsCreatingInlineItem(false);
        },
        onError(error: any) {
          message.error(processResponseError(error));
          setIsCreatingInlineItem(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple API calls if already creating an item
      if (isCreatingInlineItem) {
        return;
      }

      if (searchQuery.trim()) {
        const existingTag = searchResults.find(
          (tag) => tag.value.toLowerCase() === searchQuery.toLowerCase().trim()
        );

        if (existingTag) {
          const currentTags = value || [];
          if (!currentTags.includes(existingTag.value)) {
            setValue([...currentTags, existingTag.value]);
          }
          setSearchQuery("");
          setInputValue("");
          setSearchResults([]);
        } else {
          handleCreateInlineTag(searchQuery.trim());
        }
      }
    }
  };

  const handleChange = (newValue: string[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue);
    }
    setSearchQuery("");
    setInputValue("");
    setSearchResults([]);
  };

  // Effect to handle value validation and state updates
  useEffect(() => {
    const rawValue = value;

    // If value is not an array, reset to last valid items
    if (!Array.isArray(rawValue)) {
      setValue(lastValidItems);
      return;
    }

    // Update lastValidItems if value has changed
    if (JSON.stringify(rawValue) !== JSON.stringify(lastValidItems)) {
      setLastValidItems(rawValue);
    }
  }, [value, lastValidItems, setValue]);

  const getSafeValue = () => {
    // Only return a safe value for rendering, no state updates
    if (!Array.isArray(value)) {
      return lastValidItems;
    }
    return value;
  };

  const getOptions = () => {
    const formValue = value;
    const selectedTags = Array.isArray(formValue) ? formValue : [];

    const searchOptions = searchResults.map((result) => {
      const isAlreadySelected = selectedTags.includes(result.value);
      return {
        ...result,
        disabled: isAlreadySelected,
        isSelected: isAlreadySelected,
      };
    });

    return searchOptions;
  };

  return (
    <Select
      mode="multiple"
      value={getSafeValue()}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      size={size}
      showSearch
      searchValue={inputValue}
      onSearch={handleSearch}
      onInputKeyDown={handleKeyDown}
      loading={isSearching || isCreatingInlineItem}
      filterOption={false}
      autoClearSearchValue={false}
      disabled={disabled}
      options={getOptions()}
      optionRender={(option) => <div>{option.label}</div>}
      dropdownRender={(menu) => <div>{menu}</div>}
      notFoundContent={
        searchQuery.trim() && !isSearching ? (
          <div className="p-2 text-center text-zui-silver">
            Press <kbd className=" text-xs">Enter</kbd> or{" "}
            <kbd className=" text-xs">,</kbd> to create "{searchQuery.trim()}"
          </div>
        ) : (
          <div className="p-2 text-center text-zui-silver">
            {isSearching ? "Searching..." : "Start typing to search tags"}
          </div>
        )
      }
    />
  );
};

export default SearchableCreateSelect;
