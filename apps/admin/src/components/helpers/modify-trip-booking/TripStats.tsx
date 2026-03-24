import {
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { TripBooking } from "apps/admin/src/config/typings";
import React from "react";
import { formatPrice } from "../../../utils/formatPrice";

const { Text } = Typography;

interface TripStatsProps {
  bookingData: TripBooking;
}

const TripStats: React.FC<TripStatsProps> = ({ bookingData }) => {
  const getDaysDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-zui-light p-4 text-center">
        <TeamOutlined className=" text-xl mb-2" />
        <div className="text-lg">{bookingData?.customers?.length || 0}</div>
        <Text className="text-xs  uppercase tracking-wide">Guests</Text>
      </div>
      <div className="bg-zui-light p-4 text-center">
        <DollarOutlined className="text-zui-green text-xl mb-2" />
        <div className="text-lg  text-zui-green">
          {bookingData?.total_amount &&
          bookingData?.booked_skus?.[0]?.sku?.currency
            ? formatPrice(
                bookingData.total_amount,
                bookingData.booked_skus[0].sku.currency
              )
            : "N/A"}
        </div>
        <Text className="text-xs text-zui-green uppercase tracking-wide">
          Total
        </Text>
      </div>
      <div className="bg-zui-light p-4 text-center">
        <CalendarOutlined className=" text-xl mb-2" />
        <div className="text-lg">
          {bookingData?.start_at && bookingData?.end_at
            ? getDaysDifference(bookingData.start_at, bookingData.end_at)
            : "N/A"}
        </div>
        <Text className="text-xs  uppercase tracking-wide">Days</Text>
      </div>
    </div>
  );
};

export default TripStats;
