"use client";

import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

interface DatePickerWithRangeProps {
  className?: string;
  onChange?: (range: DateRange | undefined) => void;
  modifiers: GeneralObject;
  date: DateRange | null;
  fromLabel: string;
  hideClear?: boolean;
  toLabel: string;
  maxDate: Date;
}

export const DatePickerWithRange: React.FC<DatePickerWithRangeProps> = ({
  className,
  onChange,
  modifiers,
  date,
  fromLabel,
  toLabel,
  hideClear,
  maxDate,
}) => {
  const [isOpen, setOpen] = useState<boolean>(false);

  const handleDateChange = (e: DateRange | undefined) => {
    onChange?.(e);
  };

  const clearDateRange: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    handleDateChange(undefined);
    setOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      if (!date?.from || !date?.to) {
        handleDateChange(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover onOpenChange={setOpen} open={isOpen}>
        <PopoverTrigger asChild>
          <button
            id="date"
            className={cn(
              "h-12 text-xs flex items-center justify-between border border-zui-light px-4 gap-6 relative"
            )}
          >
            <span className="flex flex-col items-start w-20">
              <span>{fromLabel}</span>
              {date?.from && <span>{format(date?.from, "d MMM")}</span>}
            </span>
            <span className="text-zui-silver ">→</span>
            <span className="flex flex-col items-start w-20">
              <span>{toLabel}</span>
              {date?.to && <span>{format(date?.to, "d MMM")}</span>}
            </span>
            {!hideClear && date?.to && date?.from && (
              <button
                onClick={clearDateRange}
                className="absolute right-0 top-0 p-2 z-[1]"
              >
                <Icon name="CrossCircle" className="w-4 h-4" fill="#FFF" />
              </button>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date()}
            selected={date ?? undefined}
            onSelect={handleDateChange}
            numberOfMonths={2}
            modifiers={modifiers}
            disabled={{
              after: maxDate,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
