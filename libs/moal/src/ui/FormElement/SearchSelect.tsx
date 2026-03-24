/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { useKeypress, useOutsideClick } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { debounce } from "lodash";
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
  value: any;
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

const Select: React.FC<SelectProps> = ({
  name,
  value,
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
    setValue(data);
    setQuery("");
    setDropdownVisible(false);
  };

  const removeValue: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setValue(null);
    setInputVisible(false);
  };

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      if (query.length > 1) {
        setDropdownVisible(true);
        refetchUser()
          .then((res) => {
            setResults(res.data?.data?.results);
          })
          .catch((e) => {
            console.error("Search error:", e);
          });
      } else {
        setResults([]);
        if (!emptyListComponent) {
          setDropdownVisible(false);
        }
      }
    }, 300)
  ).current;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
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

  useEffect(() => {
    if (value != null) {
      setInputVisible(true);
    }
  }, [value]);

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
      className="flex flex-col items-center w-full relative h-16 bg-zui-light"
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
        {value == null ? (
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
        ) : (
          <div className="w-full relative h-16 pl-6 pr-12 zui-form-element placeholder:text-zui-silver pt-[28px] font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent">
            {selectedValueSelector?.(value) || value?.id || "NA"}
          </div>
        )}
        {value == null ? (
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
          ) : emptyListComponent ? (
            React.cloneElement(emptyListComponent, {
              searchTerm: query,
              setValue: setValue,
            })
          ) : (
            <div className="w-full p-2 text-sm font-medium text-center text-subtitle">
              No options
            </div>
          )}
        </ul>
      )}
    </div>
  );
};

export default React.memo(Select);