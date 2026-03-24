import React, { useEffect } from "react";
import { Select } from "../../ui";
import { cn } from "@zo/utils/font";

interface DateFilterProps {
  selectedDate: string | undefined;
  onDateChange: (date: string) => void;
  options: Array<{ label: string; value: string }>;
  className?: string;
  optionsContainerClassName?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  selectedDate,
  onDateChange,
  options,
  optionsContainerClassName,
  className,
}) => {
  useEffect(() => {
    if (options && options.length > 0 && selectedDate == null) {
      onDateChange(options[0].value);
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
      placeholder="🗓️ Select Date"
      value={selectedDate}
      onChange={onDateChange}
      options={options}
    />
  );
};

export default DateFilter;
