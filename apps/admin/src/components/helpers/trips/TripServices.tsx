import { Currency } from "@zo/definitions/admin";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Tag, Typography } from "antd";
import { formatPrice } from "apps/admin/src/utils/formatPrice";
import moment from "moment";
import React, { useMemo } from "react";

const { Text } = Typography;

interface TripService {
  id: number;
  name: string;
  description?: string;
  status: string;
  units: number;
  price: number;
  offer_discount?: number;
  coupon_discount?: number;
  is_custom_upgrade?: boolean;
  created_at: string;
  tax?: {
    tax_amount: number;
    currency: Currency;
  };
}

interface TripServicesProps {
  services?: TripService[];
  label?: string; // column header for name
  emptyMessage?: string; // message when no services
}

const TripServices: React.FC<TripServicesProps> = ({
  services = [],
  label = "Service Name",
  emptyMessage = "Not Added",
}) => {
  const formatDate = (dateString: string) =>
    moment(dateString).format("DD MMM YYYY, hh:mm A");

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "requested":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (_, data) => data?.name,
      },
      {
        title: "Added On",
        dataIndex: "created_at",
        key: "created_at",
        render: (_, data) => (
          <span className="text-zui-white">{formatDate(data?.created_at)}</span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (_, data) => {
          return <Tag color={getStatusColor(data?.status)}>{data?.status}</Tag>;
        },
      },
      {
        title: "Price",
        dataIndex: "price",
        key: "price",
        render: (_, data) => {
          return (
            <span className="text-zui-white font-bold">
              {formatPrice(data?.price, data?.tax?.currency)}
            </span>
          );
        },
      },
      {
        title: "Tax",
        key: "taxAmount",
        dataIndex: "taxAmount",
        render: (_, data) => {
          const tax = data?.tax;

          const totalTax = (tax?.tax_amount || 0) + (tax?.tcs || 0);

          return (
            <div className="text-zui-white space-y-1">
              {/* Total Tax */}
              <div className="font-semibold">
                Total: {formatPrice(totalTax, tax?.currency) || "₹ 0"}
              </div>

              {/* Breakdown */}
              <div className="text-sm opacity-80">
                <div>TCS: {formatPrice(tax?.tcs, tax?.currency)}</div>
                <div>
                  State Tax: {formatPrice(tax?.state_tax, tax?.currency)}
                </div>
                <div>
                  Country Tax: {formatPrice(tax?.country_tax, tax?.currency)}
                </div>
                <div>
                  Tax Amount: {formatPrice(tax?.tax_amount, tax?.currency)}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        title: "Total Amount",
        dataIndex: "totalAmount",
        key: "totalAmount",
        render: (_, data) => {
          const tax = data?.tax;
          const totalTax = (tax?.tax_amount || 0) + (tax?.tcs || 0);
          const totalAmount = (data?.price || 0) + totalTax;

          return (
            <span className="text-zui-white font-semibold">
              {formatPrice(totalAmount, tax?.currency) || "₹ 0"}
            </span>
          );
        },
      },
      {
        title: "Units",
        dataIndex: "units",
        key: "units",
        render: (_, data) => {
          return <span className="text-zui-white">{data?.units || 1}</span>;
        },
      },
    ],
    []
  );

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-1">
        <Text className="text-zui-white text-lg font-medium block mb-2">
          {emptyMessage}
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ZudTable
        data={services}
        isLoading={false}
        columns={columns}
        keyExtractor={(row) => row.id.toString()}
      />
    </div>
  );
};

export default TripServices;
