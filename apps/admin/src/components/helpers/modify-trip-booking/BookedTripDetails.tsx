import { CopyOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Button, Card, Tag, Tooltip, Typography } from "antd";
import moment from "moment";
import React from "react";
import { formatPrice } from "../../../utils/formatPrice";

const { Text } = Typography;

interface BookedTripDetailsProps {
  bookingData: any;
  onCopyToClipboard: (text: string, label: string) => void;
}

const BookedTripDetails: React.FC<BookedTripDetailsProps> = ({
  bookingData,
  onCopyToClipboard,
}) => {
  const formatDate = (dateString: string) => {
    return moment(dateString).format("DD MMM YYYY");
  };

  return (
    <Card
      className="bg-zui-light"
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <InfoCircleOutlined />
            <span className="font-medium">Current Booking Information</span>
          </div>
          <Tag color="green" className="font-medium text-sm px-3 py-1">
            {bookingData?.status?.toUpperCase()}
          </Tag>
        </div>
      }
    >
      <div className="space-y-1">
        {/* Booking ID and Copy */}
        <div className="flex items-center justify-between p-3">
          <div>
            <Text className="text-xs uppercase tracking-wide">Booking ID</Text>
            <div className="font-mono text-zui-silver font-medium">
              {bookingData?.pid}
            </div>
          </div>
          <Tooltip title="Copy Booking ID">
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => onCopyToClipboard(bookingData?.pid, "Booking ID")}
            />
          </Tooltip>
        </div>

        {/* Trip Information */}
        <div className="p-3">
          <Text className="text-xs uppercase tracking-wide text-zui-neon">
            Current Trip Details
          </Text>

          <div className="mt-1 space-y-1">
            {bookingData?.booked_skus?.[0] && (
              <>
                <div className="text-zui-silver font-medium">
                  {bookingData.booked_skus[0].sku?.inventory?.name}
                </div>

                {bookingData.booked_skus[0].sku?.itinerary?.title && (
                  <div className="text-xs">
                    {bookingData.booked_skus[0].sku.itinerary.title}
                  </div>
                )}

                <div className="text-xs">
                  Group:{" "}
                  <span className="text-zui-neon">
                    {bookingData.booked_skus[0].sku?.name}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trip Dates */}
        {bookingData?.start_at && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3">
              <Text className="text-xs uppercase tracking-wide text-zui-green">
                Start Date
              </Text>
              <div className="text-zui-silver font-medium">
                {formatDate(bookingData.start_at)}
              </div>
            </div>
            <div className="p-3">
              <Text className="text-xs uppercase tracking-wide text-zui-red">
                End Date
              </Text>
              <div className="text-zui-silver font-medium">
                {formatDate(bookingData.end_at)}
              </div>
            </div>
          </div>
        )}

        {/* Payment Information */}
        <div className="p-3 bg-zui-lightest">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-xs uppercase tracking-wide">
              Payment Status
            </Text>
            <Tag
              color={
                bookingData?.paid_amount >= bookingData?.total_amount
                  ? "green"
                  : "orange"
              }
            >
              {bookingData?.paid_amount >= bookingData?.total_amount
                ? "PAID"
                : "PENDING"}
            </Tag>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="text-xs text-zui-silver">Paid Amount</Text>
              <div className="font-semibold text-zui-green">
                {bookingData?.paid_amount !== undefined &&
                bookingData?.booked_skus?.[0]?.sku?.currency
                  ? formatPrice(
                      bookingData.paid_amount,
                      bookingData.booked_skus[0].sku.currency
                    )
                  : "N/A"}
              </div>
            </div>
            <div>
              <Text className="text-xs text-zui-silver">Remaining</Text>
              <div className="font-semibold text-zui-red">
                {bookingData?.total_amount !== undefined &&
                bookingData?.paid_amount !== undefined &&
                bookingData?.booked_skus?.[0]?.sku?.currency
                  ? formatPrice(
                      (bookingData.total_amount || 0) -
                        (bookingData.paid_amount || 0),
                      bookingData.booked_skus[0].sku.currency
                    )
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BookedTripDetails;
