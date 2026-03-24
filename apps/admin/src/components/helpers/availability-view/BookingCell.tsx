import {
  CalendarOutlined,
  CheckCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { GeneralObject } from "@zo/definitions/general";
import { Avatar } from "@zo/moal";
import { List, Popover } from "antd";
import { format } from "date-fns";
import React, { useMemo } from "react";

interface BookingCellProps {
  booking: GeneralObject;
  onClick: () => void;
}

const BookingCell: React.FC<BookingCellProps> = ({ booking, onClick }) => {
  const left = useMemo(() => {
    if (booking.isOlder) {
      return 8;
    } else {
      return 56 + 4;
    }
  }, [booking]);

  const width = useMemo(() => {
    const baseWidth = 96 * Math.max(booking.columnSpan, 1); // Base width considering full columns
    const totalBorders = 1 * (Math.max(booking.columnSpan, 1) - 1); // Total width added by the 1px border between columns
    const continuationPadding = booking.isContinuing ? 8 : 0; // 8px padding if booking continues to the next page

    if (booking.isOlder) {
      if (booking.isLaterEnding) {
        // Booking starts before visible date range and ends after visible date range
        return baseWidth + totalBorders - 16 + continuationPadding; // Adjusted for padding on both sides
      } else {
        // Booking starts before visible date range but ends within it
        return baseWidth - 96 + 44 + continuationPadding; // Adjusted width
      }
    } else {
      if (booking.isLaterEnding) {
        // Booking starts within visible date range and ends after it
        return 56 + baseWidth + totalBorders - 12 + continuationPadding;
      } else {
        // Booking starts and ends within the visible date range
        return baseWidth + totalBorders - 12;
      }
    }
  }, [booking]);

  const popoverContent = (
    <div className="w-60">
      <div className="flex items-center gap-4 mb-3">
        <Avatar
          size={24}
          badgeSize={12}
          src={booking?.user?.pfp_image}
          isFounder={booking?.user?.membership === "founder"}
          alt={booking?.user?.nickname || "Zo User"}
          className="flex-shrink-0"
        />
        <div>
          <p className="font-medium">{booking?.user?.nickname || "Zo User"}</p>
          <p className="text-sm text-zui-silver truncate">
            {booking?.user?.email_address}
          </p>
        </div>
      </div>
      <List
        size="small"
        split={false}
        dataSource={[
          {
            icon: <HomeOutlined className="text-gray-500" />,
            value: booking?.booked_skus?.[0]?.sku?.inventory?.name,
          },
          {
            icon: <CheckCircleOutlined className="text-gray-500" />,
            value: <span className="capitalize">{booking?.status}</span>,
          },
          {
            icon: <CalendarOutlined className="text-gray-500" />,
            value: (
              <span>
                {format(new Date(booking?.start_at), "MMM dd")} -{" "}
                {format(new Date(booking?.end_at), "MMM dd, yyyy")}
              </span>
            ),
          },
        ]}
        renderItem={(item) => (
          <List.Item>
            <div className="flex items-center gap-x-2">
              {item.icon}
              <span>{item.value}</span>
            </div>
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      placement="top"
      trigger="hover"
      overlayClassName="booking-cell-popover"
    >
      <button
        className="absolute z-[1] hover:z-[2] cursor-pointer bottom-2 h-10 flex items-center gap-x-3 justify-start px-4 bg-zui-light border border-zui-light hover:border-zui-white transition-all duration-150 ease-in-out"
        style={{
          left,
          width,
        }}
        onClick={onClick}
      >
        <Avatar
          size={24}
          badgeSize={12}
          src={booking?.user?.pfp_image}
          isFounder={booking?.user?.membership === "founder"}
          alt={booking?.user?.nickname || "Zo User"}
          className="flex-shrink-0"
        />
        <span className="truncate font-normal">
          {booking?.user?.nickname || "Zo User"}
        </span>
      </button>
    </Popover>
  );
};

export default BookingCell;
