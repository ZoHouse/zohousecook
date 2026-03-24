/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
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
  options?: Array<{ value: string; label: string; hint?: string }>;
  value: any;
  name: string;
  label: string;
  setValue: React.Dispatch<any>;
  required?: boolean;
  placeholder?: string;
  initialValue?: any;
  disabled?: boolean;
  searchQueryResultRenderer?: (result: any) => JSX.Element;
}

const Select: React.FC<SelectProps> = ({
  options,
  name,
  value,
  setValue,
  label,
  required,
  placeholder,
  initialValue,
  disabled,
  searchQueryResultRenderer,
}) => {
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<any>(value || initialValue);
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [results, setResults] = useState<
    Array<{ value: string; label: string; hint?: string }>
  >([]);
  const [scrollPosition, setScrollPosition] = useState(() => {
    if (selected != null) {
      return (
        (options || []).findIndex((option) => option.value === selected) || 0
      );
    }
    return 0;
  });
  const [isInputVisible, setInputVisible] = useState<boolean>(
    isValidString(placeholder)
  );

  const handleFocus = () => {
    setInputVisible(true);
  };

  const handleBlur = () => {
    if (
      !isValidString(placeholder) &&
      (value == null ||
        value?.length === 0 ||
        query == null ||
        query?.length === 0)
    ) {
      setInputVisible(false);
    }
  };

  useEffect(() => {
    if (query) {
      setInputVisible(true);
    } else if (!isInputVisible) {
      if (!isValidString(placeholder)) {
        setInputVisible(false);
      }
    }
  }, [query]);

  const selectRef = useRef<HTMLDivElement | null>(null);
  const inputUpKey = useKeypress("ArrowUp", selectRef, 300);
  const inputDownKey = useKeypress("ArrowDown", selectRef, 300);
  const inputEscapeKey = useKeypress("Escape", selectRef);

  useEffect(() => {
    setResults(
      query !== ""
        ? (options || []).filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase())
          )
        : options || []
    );
  }, [options, query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value === "") {
      setSelected(null);
    }
  };

  const removeValue: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setValue(null);
    setSelected(null);
    setInputVisible(false);
  };

  useEffect(() => {
    setResults(options || []);
  }, [options]);

  useEffect(() => {
    if (!dropdownVisible) {
      if (selected != null) {
        console.log(
          "SELECTED",
          selected,
          options,
          options?.find((option) => option.value === selected)?.label
        );
        setQuery(
          options?.find((option) => option.value === selected)?.label || ""
        );
      } else {
        setQuery("");
        setSelected(null);
      }
      setResults(options || []);
    }
  }, [dropdownVisible, options, selected]);

  useEffect(() => {
    if (selected !== value && selected != null) {
      setValue(selected);
    }
    setQuery(options?.find((option) => option.value === selected)?.label || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selected]);

  useEffect(() => {
    if (value) {
      setSelected(value);
    } else if (value === null) {
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
        setSelected(results[scrollPosition].value);
      toggleDropdown();
    }
  };

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

  useOutsideClick(selectRef, () => setDropdownVisible(false));

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
        "flex flex-col items-center w-full relative h-16 bg-zui-light",
        disabled ? "cursor-not-allowed" : "cursor-default"
      )}
      ref={selectRef}
      onClick={() => !disabled && setDropdownVisible((v) => !v)}
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
          className="w-full relative h-16 pl-6 pr-12 zui-form-element placeholder:text-zui-silver pt-[16px] font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={query}
          onChange={handleChange}
          autoComplete="off"
        />
        {isValidString(value) ? (
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
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "absolute top-3 right-2 p-2 cursor-pointer pointer-events-none text-text focus:outline-none transition-all ease-in-out duration-100",
              dropdownVisible && "transform rotate-180"
            )}
          >
            <Icon name="AngleDown" className="w-6 h-6" />
          </button>
        )}
      </div>
      {dropdownVisible && (
        <ul className="__select__ absolute z-20 top-full left-0 w-full bg-zui-dark border-t border-zui-lighter shadow-md overflow-y-auto max-h-[200px]">
          {results && results.length > 0 ? (
            results.map((option, index) => (
              <li
                key={option.value}
                className={cn(
                  "select__options w-full px-6 py-3 cursor-pointer flex flex-col hover:bg-zui-light",
                  scrollPosition === index && "bg-zui-light border"
                )}
                onClick={setSelected.bind(null, option.value)}
              >
                {searchQueryResultRenderer ? (
                  searchQueryResultRenderer(option)
                ) : (
                  <>
                    <span>{option.label}</span>
                    {option.hint != null && (
                      <span className="text-xs mt-1 font-medium text-subtitle text-zui-silver">
                        {option.hint}
                      </span>
                    )}
                  </>
                )}
              </li>
            ))
          ) : (
            <div className="pointer-events-none w-full p-2 text-sm font-medium text-center text-subtitle">
              No options
            </div>
          )}
        </ul>
      )}
    </div>
  );
};

export default Select;
