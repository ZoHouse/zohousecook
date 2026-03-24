import Icon from "@zo/assets/icons";
import React, { useEffect, useRef, useState } from "react";

interface CollapsibleSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  isExpanded?: boolean;
  disableCollapse?: boolean;
}

const CollapsibleSearch: React.FC<CollapsibleSearchProps> = ({
  value,
  onChange,
  isExpanded,
  disableCollapse,
}) => {
  const [isSearching, setSearching] = useState<boolean>(false);
  const [shouldClear, setShouldClear] = useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const toggleSearching = (clear: boolean) => {
    setSearching((prev) => {
      if (prev && clear) {
        onChange?.("");
      }
      return !prev;
    });
  };

  const handleSearchButtonClick = () => {
    setShouldClear(true);
    if (!disableCollapse) {
      toggleSearching(false);
    }
  };

  const handleClearButtonClick = () => {
    setShouldClear(true);
    if (!isExpanded && !disableCollapse) {
      toggleSearching(true);
    }
  };

  const selectRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick(selectRef, () => {
    setShouldClear(false);
    if (isSearching) {
      setSearching(false);
    }
  });

  useEffect(() => {
    if (isSearching) {
      inputRef.current?.focus();
    } else if (!isSearching && shouldClear) {
      onChange?.("");
      setShouldClear(false);
    }
  }, [isSearching, shouldClear, onChange]);

  return (
    <div className="h-12 w-auto relative" ref={selectRef}>
      {!isExpanded && !disableCollapse && (
        <button
          className="relative w-12 h-12 flex items-center justify-center border border-zui-light"
          onClick={handleSearchButtonClick}
        >
          <Icon name="Search" size={16} fill="#FFF" />
        </button>
      )}
      {(isSearching || isExpanded) && (
        <div className="flex items-center space-x-3 justify-between w-[calc(100vw-48px)] md:w-[352px] absolute top-0 right-0 bottom-0 px-4 border border-zui-light bg-zui-dark">
          <Icon name="Search" size={16} fill="#FFF" />
          <input
            ref={inputRef}
            type="text"
            className="w-full text-xs caret-zui-neon h-full bg-transparent focus:outline-none"
            placeholder="Search"
            value={value}
            onChange={handleChange}
          />
          <button
            className="relative flex items-center justify-center"
            onClick={handleClearButtonClick}
          >
            <Icon name="CrossCircle" size={16} fill="#5A5A5A" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSearch;

const useOutsideClick = (
  node: React.RefObject<HTMLDivElement>,
  callback: () => void
) => {
  const handler = (e: Event) => {
    if (node.current && !node.current.contains(e.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    };
  });
};
