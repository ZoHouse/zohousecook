import React, { useEffect } from "react";
import { Select } from "../../ui";
import { cn } from "@zo/utils/font";

interface CategoryFilterProps {
  selectedCategory: string | undefined;
  options: Array<{ label: string; value: string; icon?: string }>;
  onCategoryChange: (date: string) => void;
  className?: string;
  optionsContainerClassName?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  options,
  className,
  optionsContainerClassName,
  onCategoryChange,
}) => {
  useEffect(() => {
    if (options && options.length > 0 && selectedCategory == null) {
      onCategoryChange(options[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  return (
    <Select
      className={cn(
        "max-h-8 w-36 bg-zui-dark rounded-full text-xs font-semibold",
        className
      )}
      selectContentClassName={cn(
        "rounded-xl border border-zui-lightest",
        optionsContainerClassName
      )}
      placeholder="🗓️ All Events"
      value={selectedCategory}
      onChange={onCategoryChange}
      options={options}
    />
  );
};

export default CategoryFilter;
