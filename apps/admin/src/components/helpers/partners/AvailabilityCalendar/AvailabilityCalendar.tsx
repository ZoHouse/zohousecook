import { Empty, Typography } from "antd";
import { SelectionsInventory } from "apps/admin/src/config";
import dayjs, { Dayjs } from "dayjs";
import React, { useMemo } from "react";
import {
  AvailabilityCalendarFooter,
  AvailabilityCalendarHeader,
  AvailabilityCalendarTable,
} from ".";

export interface AvailabilityCalendarParams {
  operator_id: string;
  start_date: string;
  end_date: string;
}

interface PartnerAvailabilityCalendarProps {
  inventories: SelectionsInventory[];
  operators: { value: string; label: string }[];
  params: AvailabilityCalendarParams;
}

const useDateRange = (params: AvailabilityCalendarParams): Dayjs[] => {
  return useMemo(() => {
    if (!params.start_date || !params.end_date) return [];

    const start = dayjs(params.start_date).startOf("day");
    const end = dayjs(params.end_date).startOf("day");

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) return [];

    const diff = end.diff(start, "day");
    return Array.from({ length: diff + 1 }, (_, i) => start.add(i, "day"));
  }, [params.start_date, params.end_date]);
};

export const PartnerAvailabilityCalendar: React.FC<
  PartnerAvailabilityCalendarProps
> = ({ inventories, operators, params }) => {
  const dates = useDateRange(params);

  const totalInventories = inventories.length;
  const totalDays = dates.length;

  return (
    <div className="w-full overflow-hidden border border-zui-lightest bg-zui-dark">
      {/* Header */}
      {operators.length > 0 && (
        <AvailabilityCalendarHeader
          operatorId={params.operator_id || ""}
          operators={operators}
          params={params}
        />
      )}

      {/* Main Content */}
      {totalInventories > 0 ? (
        <AvailabilityCalendarTable
          inventories={inventories}
          dates={dates.map((d) => d.toDate())}
        />
      ) : (
        <div className="p-12 flex justify-center">
          <Empty
            description={
              <Typography.Text type="secondary">
                No inventory available
              </Typography.Text>
            }
            className="py-10"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}

      {/* Footer */}
      <AvailabilityCalendarFooter
        totalInventories={totalInventories}
        totalDays={totalDays}
      />
    </div>
  );
};

export default PartnerAvailabilityCalendar;
