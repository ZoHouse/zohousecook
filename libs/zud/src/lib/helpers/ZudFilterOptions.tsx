import { SearchOutlined } from "@ant-design/icons";
import Icon from "@zo/assets/icons";
import { cn, fontClassName } from "@zo/utils/font";
import { Select as AntSelect, DatePicker, Input, Space, Tooltip } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import debounce from "lodash.debounce";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

const { RangePicker } = DatePicker;

export type ZudFilterOptionType = {
  type: "select" | "date_range" | "date" | "ordering";
  key: string;
  placeholder?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  hint?: string;
  className?: string;
  startKey?: string;
  endKey?: string;
  fromLabel?: string;
  toLabel?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  defaultSortKey?: string;
};

export interface ZudFilterOptionsProps {
  name: string;
  searchKey?: string;
  className?: string;
  hasSearch?: boolean;
  options?: ZudFilterOptionType[];
  onDateChange?: (range: [Dayjs, Dayjs] | null) => void;
}

const ZudFilterOptions: React.FC<ZudFilterOptionsProps> = ({
  name,
  hasSearch,
  className,
  searchKey,
  options = [],
  onDateChange = () => {},
}) => {
  const router = useRouter();
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [searchValue, setSearchValue] = useState<string>("");

  const maxDate = dayjs().startOf("day");

  useEffect(() => {
    const query = router.query;
    const newOptionValues: Record<string, string> = {};

    options.forEach((option) => {
      if (option.key) {
        const key = `${name}-${option.key}`;
        if (query[key]) {
          newOptionValues[option.key] = query[key] as string;
        }
      }
    });

    setOptionValues(newOptionValues);
    setSearchValue((query[`${name}-${searchKey || "search"}`] as string) || "");
  }, [router.query, name, options, searchKey]);

  const handleChange = (key: string, value: string | null) => {
    if (!value || value === "null") {
      const { [`${name}-${key}`]: _, ...query } = router.query;
      router.push({ query }, undefined, { shallow: true });
    } else {
      router.push(
        {
          query: {
            ...router.query,
            [`${name}-${key}`]: value,
          },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const debouncedUpdateQuery = useMemo(
    () =>
      debounce((value: string) => {
        router.push(
          {
            query: {
              ...router.query,
              [`${name}-${searchKey || "search"}`]: value,
            },
          },
          undefined,
          { shallow: true }
        );
      }, 500),
    [router, name, searchKey]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedUpdateQuery(value);
  };

  useEffect(() => {
    return () => {
      debouncedUpdateQuery.cancel();
    };
  }, [debouncedUpdateQuery]);

  const handleDateRangeChange = (
    startKey: string | undefined,
    endKey: string | undefined,
    dates: [Dayjs, Dayjs] | null
  ) => {
    if (!dates || !startKey || !endKey) {
      const query = { ...router.query };
      delete query[`${name}-${startKey}`];
      delete query[`${name}-${endKey}`];
      router.push({ query }, undefined, { shallow: true });
      onDateChange(null);
      return;
    }

    const [start, end] = dates;
    router.push(
      {
        query: {
          ...router.query,
          [`${name}-${startKey}`]: start.format("YYYY-MM-DD"),
          [`${name}-${endKey}`]: end.format("YYYY-MM-DD"),
        },
      },
      undefined,
      { shallow: true }
    );
    onDateChange(dates);
  };

  return hasSearch || options.length > 0 ? (
    <div
      className={cn(
        "flex items-center justify-between mb-6 w-full gap-4",
        className
      )}
    >
      <Space wrap>
        {options.map((option) => {
          if (option.type === "select") {
            return (
              <div className="flex flex-col gap-2" key={option.key}>
                {option.label && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-zui-silver">
                      {option.label}
                    </span>
                    {option.hint && (
                      <Tooltip title={option.hint} placement="top">
                        <span className={fontClassName}>
                          <Icon name="Info" className="w-4 h-4" />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                )}
                <AntSelect
                  className={option.className}
                  placeholder={option.placeholder}
                  value={optionValues[option.key] || null}
                  options={option.options || []}
                  onChange={(value) => handleChange(option.key, value)}
                  style={{ minWidth: 120 }}
                  size="large"
                />
              </div>
            );
          }

          if (option.type === "date_range") {
            return (
              <div className="flex flex-col gap-2">
                {option.label && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-300">
                      {option.label}
                    </span>
                    {option.hint && (
                      <Tooltip title={option.hint} placement="top">
                        <span className={fontClassName}>
                          <Icon name="Info" className="w-4 h-4 text-gray-300" />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                )}
                <RangePicker
                  key={option.key}
                  size="large"
                  disabledDate={(date: Dayjs) => date.isAfter(dayjs(maxDate))}
                  onChange={(dates) =>
                    handleDateRangeChange(
                      option.startKey,
                      option.endKey,
                      dates as [Dayjs, Dayjs] | null
                    )
                  }
                  placeholder={[
                    option.fromLabel || "From",
                    option.toLabel || "To",
                  ]}
                />
              </div>
            );
          }

          if (option.type === "date") {
            return (
              <DatePicker
                key={option.key}
                size="large"
                placeholder={option.label}
                disabled={option.disabled}
                value={
                  optionValues[option.key]
                    ? moment(optionValues[option.key])
                    : null
                }
                onChange={(date) =>
                  handleChange(
                    option.key,
                    date ? date.format("YYYY-MM-DD") : null
                  )
                }
              />
            );
          }

          return null;
        })}
      </Space>

      {hasSearch && (
        <Input
          placeholder="Search"
          size="large"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={handleSearchChange}
          allowClear
          style={{ maxWidth: 200 }}
        />
      )}
    </div>
  ) : null;
};

export default ZudFilterOptions;
