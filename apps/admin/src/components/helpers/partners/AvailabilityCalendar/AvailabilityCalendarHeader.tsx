import { Button, DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import Icon from "libs/assets/icons/src/Icon";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";
import { AvailabilityCalendarParams } from "./AvailabilityCalendar";

const { RangePicker } = DatePicker;

const formatDate = (date: Dayjs) => date.format("YYYY-MM-DD");

interface AvailabilityCalendarHeaderProps {
  operatorId: string | null;
  operators: { label: string; value: string }[];
  params: AvailabilityCalendarParams;
}

const AvailabilityCalendarHeader: React.FC<AvailabilityCalendarHeaderProps> = ({
  operatorId,
  operators,
  params,
}) => {
  const router = useRouter();

  const startDate = useMemo(
    () => dayjs(params.start_date),
    [params.start_date]
  );
  const endDate = useMemo(() => dayjs(params.end_date), [params.end_date]);

  const updateRoute = useCallback(
    (updates: Partial<AvailabilityCalendarParams>) => {
      router.push(
        {
          pathname: `/partner-availability-calendar/${
            updates.operator_id ?? params.operator_id
          }/`,
          query: {
            start_date: updates.start_date ?? params.start_date,
            end_date: updates.end_date ?? params.end_date,
          },
        },
        undefined,
        { shallow: true }
      );
    },
    [router, params]
  );

  const handleOperatorChange = useCallback(
    (value: string) => updateRoute({ operator_id: value }),
    [updateRoute]
  );

  const handleDateRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      if (dates?.[0] && dates?.[1]) {
        updateRoute({
          start_date: formatDate(dates[0]),
          end_date: formatDate(dates[1]),
        });
      }
    },
    [updateRoute]
  );

  const handleMonthShift = useCallback(
    (offset: number) => {
      const newStart = startDate.add(offset, "month").startOf("month");
      const newEnd = newStart.endOf("month");
      updateRoute({
        start_date: formatDate(newStart),
        end_date: formatDate(newEnd),
      });
    },
    [startDate, updateRoute]
  );

  const handleToday = useCallback(() => {
    const start = dayjs();
    const end = start.add(30, "days");
    updateRoute({
      start_date: formatDate(start),
      end_date: formatDate(end),
    });
  }, [updateRoute]);

  const presets: { label: string; value: [Dayjs, Dayjs] }[] = useMemo(
    () => [
      { label: "Next 7 Days", value: [dayjs(), dayjs().add(7, "d")] },
      { label: "Next 30 Days", value: [dayjs(), dayjs().add(30, "d")] },
      { label: "Next 90 Days", value: [dayjs(), dayjs().add(90, "d")] },
      {
        label: "This Month",
        value: [dayjs().startOf("month"), dayjs().endOf("month")],
      },
    ],
    []
  );

  const operatorsOptions = useMemo(() => {
    return operators.map((operator) => ({
      label: operator.label,
      value: operator.value,
    }));
  }, [operators]);

  return (
    <div className="border-b border-zui-lightest">
      <div className="p-6 flex flex-col gap-6">
        {/* Operator Selector */}
        <div className="flex justify-between items-center">
          <p className="text-zui-silver text-sm">
            View room availability, pricing, and rate plans. Select a date range
            to see details.
          </p>
          <div className="flex flex-col items-center gap-2">
            <p className="text-zui-silver text-sm">Select Operator</p>
            <Select
              value={operatorId ?? undefined}
              onChange={handleOperatorChange}
              options={operatorsOptions}
              placeholder="Select Operator"
              size="large"
              className="w-48"
            />
          </div>
        </div>

        {/* Date Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zui-neon mb-2 uppercase tracking-wider">
              Date Range
            </label>
            <RangePicker
              value={[startDate, endDate]}
              onChange={handleDateRangeChange}
              format="MMM DD, YYYY"
              size="large"
              presets={presets}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleToday}
              size="large"
              className="bg-zui-neon text-zui-dark hover:bg-zui-neon/80 border-0 font-semibold"
            >
              Today
            </Button>
            <Button
              onClick={() => handleMonthShift(-1)}
              icon={<Icon name="AngleLeft" className="w-4 h-4" />}
              size="large"
              className="border-zui-lightest text-zui-white hover:border-zui-neon hover:text-zui-neon"
            >
              Previous
            </Button>
            <Button
              onClick={() => handleMonthShift(1)}
              icon={<Icon name="AngleRight" className="w-4 h-4" />}
              size="large"
              className="border-zui-lightest text-zui-white hover:border-zui-neon hover:text-zui-neon"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendarHeader;
