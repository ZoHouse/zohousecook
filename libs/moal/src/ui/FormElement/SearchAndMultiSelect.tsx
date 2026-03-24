/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { useKeypress, useOutsideClick } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import React, { useEffect, useRef, useState } from "react";

const getScrollTopFromInsideScroll = (
  outer: Element,
  inner: Element,
  scrollPosition: number
): number => {
  const elHeight = inner.scrollHeight;
  const scrollTop = outer.scrollTop;
  const viewport = scrollTop + outer.clientHeight;
  const elOffset = elHeight * scrollPosition;

  if (elOffset < scrollTop || elOffset + elHeight > viewport) {
    return elOffset;
  }
  return scrollTop;
};

interface SelectProps {
  value: Array<GeneralObject>;
  name: string;
  label: string;
  setValue: React.Dispatch<any>;
  required?: boolean;
  placeholder?: string;
  initialValue?: any;
  disabled?: boolean;
  searchQueryApi: QueryEndpoints;
  searchQueryKeyIdentifier?: string;
  searchQueryResultRenderer?: (result: any) => JSX.Element;
  selectedValueSelector?: (data: GeneralObject) => string;
  emptyListComponent?: React.ReactElement | null;
  responseFields?: string[];
}

const SearchAndMultiSelect: React.FC<SelectProps> = ({
  name,
  value = [],
  setValue,
  label,
  required,
  placeholder,
  initialValue,
  disabled,
  searchQueryApi,
  searchQueryResultRenderer,
  selectedValueSelector,
  emptyListComponent,
  responseFields,
}) => {
  const [query, setQuery] = useState<string>("");
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [results, setResults] = useState<GeneralObject[]>([]);
  const [scrollPosition, setScrollPosition] = useState(() => {
    if (value != null) {
      return (results || []).findIndex((option) => option.id === value) || 0;
    }
    return 0;
  });
  const [isInputVisible, setInputVisible] = useState<boolean>(
    isValidString(placeholder)
  );

  const selectRef = useRef<HTMLDivElement | null>(null);
  const inputUpKey = useKeypress("ArrowUp", selectRef, 300);
  const inputDownKey = useKeypress("ArrowDown", selectRef, 300);
  const inputEscapeKey = useKeypress("Escape", selectRef);

  useOutsideClick(selectRef, () => setDropdownVisible(false));

  const { refetch: refetchUser, isLoading } = useQueryApi(
    searchQueryApi,
    { enabled: false },
    "",
    `search=${query}${
      responseFields?.length ? `&fields=${responseFields.join(",")}` : ""
    }`
  );

  const handleFocus = () => {
    setInputVisible(true);
  };

  const handleBlur = () => {
    if (!isValidString(placeholder) && (value == null || value?.length === 0)) {
      if (results.length) {
        setTimeout(() => {
          setQuery("");
        }, 250);
      } else {
        setQuery("");
      }

      setInputVisible(false);
    }
  };

  const handleClick = (data: any) => {
    setValue([...value, data]);
    setQuery("");
    setDropdownVisible(false);
  };

  const removeValue: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setQuery("");
    setInputVisible(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setDropdownVisible((v) => !v);
    }
  };

  const handleInputEnterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      !disabled &&
        dropdownVisible &&
        results &&
        results.length &&
        scrollPosition !== -1 &&
        handleClick(results[scrollPosition]);
      toggleDropdown();
    }
  };

  const handleRemove = (id: string) => {
    if (disabled) {
      return;
    }
    const filteredValues = value?.filter((val) => val.id !== id);
    setValue(filteredValues);
  };

  useEffect(() => {
    if (query) {
      setInputVisible(true);
    } else if (!isInputVisible) {
      if (!isValidString(placeholder)) {
        setInputVisible(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (value != null) {
      setInputVisible(true);
    } else {
      setValue([]);
    }
  }, [value]);

  useEffect(() => {
    let mounted = true;

    if (query.length > 1) {
      setDropdownVisible(true);
      refetchUser()
        .then((res) => {
          if (mounted) {
            const selectedIds = value.map((val) => val.id);
            const nonSelectedOptions = res.data?.data?.results.filter(
              (option: GeneralObject) => !selectedIds.includes(option.id)
            );
            setResults(nonSelectedOptions);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      setResults([]);
      if (!emptyListComponent) {
        setDropdownVisible(false);
      }
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    !disabled &&
      dropdownVisible &&
      inputUpKey &&
      results &&
      results.length &&
      setScrollPosition((p) =>
        p === -1 ? results.length - 1 : Math.max(p - 1, 0)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownVisible, inputUpKey, results]);

  useEffect(() => {
    !disabled &&
      dropdownVisible &&
      inputDownKey &&
      results &&
      results.length &&
      setScrollPosition((p) => Math.min(p + 1, results.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownVisible, inputDownKey, results]);

  useEffect(() => {
    !disabled && dropdownVisible && inputEscapeKey && setDropdownVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownVisible, inputEscapeKey]);

  useEffect(() => {
    const li = selectRef.current
      ?.getElementsByClassName("select__options")
      .item(scrollPosition);
    const ul = selectRef.current?.querySelector(".__select__");
    if (li && ul) {
      ul.scrollTop = getScrollTopFromInsideScroll(ul, li, scrollPosition);
    }
  }, [scrollPosition]);

  useEffect(() => {
    setScrollPosition(-1);
  }, [results]);

  return (
    <div
      className={cn(
        "flex flex-col items-center w-full relative bg-zui-light",
        disabled ? "cursor-not-allowed" : "cursor-default"
      )}
      ref={selectRef}
      onKeyDown={handleInputEnterKeyDown}
    >
      <div className="relative w-full z-1">
        <label
          className={cn(
            "text-xs absolute top-6 left-6 transition-all ease-in-out duration-100",
            !isInputVisible
              ? "text-zui-white"
              : "text-zui-silver -translate-y-3"
          )}
          htmlFor={name}
        >
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>

        <input
          type="text"
          name={name}
          placeholder={placeholder}
          className="w-full relative h-16 pl-6 pr-12 zui-form-element placeholder:text-zui-silver pt-4 font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={query}
          onChange={handleChange}
          autoComplete="off"
        />
        {/* ) : (
          <div className="w-full relative h-16 pl-6 pr-12 zui-form-element placeholder:text-zui-silver pt-[28px] font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent">
            {selectedValueSelector?.(value) || value?.id || ""}
          </div>
        )} */}
        {query.length <= 0 ? (
          <button
            type="button"
            className={cn(
              "absolute top-4 right-2 p-2 cursor-pointer pointer-events-none text-text focus:outline-none transition-all ease-in-out duration-100"
            )}
          >
            <Icon name="Search" className="w-6 h-6" />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "absolute top-3 z-10 right-2 p-2 cursor-pointer text-text focus:outline-none transition-all ease-in-out duration-100"
            )}
            onClick={removeValue}
            disabled={disabled}
          >
            <Icon name="Cross" className="w-6 h-6" />
          </button>
        )}
      </div>
      {/* selected values */}
      {value && value.length > 0 && (
        <ul
          className={cn(
            "flex flex-wrap items-center bg-zui-lighter w-full justify-start p-2 border border-t-0 border-zui-light",
            disabled && "cursor-not-allowed pointer-events-none select-none"
          )}
        >
          {value?.map((selected: GeneralObject) => (
            <li
              key={selected.id}
              className="m-1 bg-zui-light text-xs text-zui-white flex items-center gap-2 py-1 px-2 border border-zui-silver"
            >
              <p className="max-w-[256px] truncate">
                {searchQueryResultRenderer
                  ? searchQueryResultRenderer(selected)
                  : selected.name || selected.id || "NA"}
              </p>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(selected.id);
                }}
              >
                <Icon name="Cross" size={14} fill="#fff" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {dropdownVisible && (
        <ul className="__select__ absolute z-20 top-full left-0 w-full bg-zui-dark border-t border-zui-lighter shadow-md overflow-y-auto max-h-[200px]">
          {results && results.length > 0 ? (
            results.map((option, index) => (
              <li
                key={option.id || option.pid}
                className={cn(
                  "select__options w-full px-6 py-3 cursor-pointer flex flex-col hover:bg-zui-light",
                  scrollPosition === index && "bg-zui-light border"
                )}
                onClick={handleClick.bind(null, option)}
              >
                {searchQueryResultRenderer ? (
                  searchQueryResultRenderer(option)
                ) : (
                  <span>{option.name || option.id || "NA"}</span>
                )}
              </li>
            ))
          ) : isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader className="w-4 h-4" />
            </div>
          ) : (
            emptyListComponent || (
              <div className="w-full p-2 text-sm font-medium text-center text-subtitle">
                No options
              </div>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchAndMultiSelect;
