import { CreditCardOutlined } from "@ant-design/icons";
import { Currency } from "@zo/definitions/admin";
import { formatCapitalize } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Empty, Tag, Typography } from "antd";
import moment from "moment";
import React, { useMemo } from "react";
import { Payment } from "../../config";
import { formatPrice } from "../../utils/formatPrice";

const { Title, Text } = Typography;

interface PaymentInformationProps {
  payments?: Payment[];
  currency?: Currency;
}

const PaymentInformation: React.FC<PaymentInformationProps> = ({
  payments,
  currency,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "success";
      case "in-progress":
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
        title: "Order ID",
        dataIndex: "order_description",
        key: "order_description",
        render: (_, data) => data?.order_description,
      },
      {
        title: "Payment Mode",
        dataIndex: "payment_mode",
        key: "payment_mode",
        render: (_, data) => {
          return data?.payment_mode ? (
            data?.payment_mode === "credits" ? (
              <span className="text-zui-orange">Credits</span>
            ) : (
              <span className="text-zui-white">
                {formatCapitalize(data?.payment_mode)}
              </span>
            )
          ) : (
            <Tag color="red">N/A</Tag>
          );
        },
      },
      {
        title: "Type",
        dataIndex: "intent",
        key: "intent",
        render: (_, data) => {
          return data?.intent === 1 ? (
            <Tag color="green">Payment</Tag>
          ) : (
            <Tag color="red">Refund</Tag>
          );
        },
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
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        render: (_, data) => {
          return formatPrice(
            data?.amount * Math.pow(10, 8),
            currency || ({} as Currency)
          );
        },
      },
      {
        title: "Date",
        dataIndex: "date",
        key: "created_at",
        render: (_, data) =>
          moment(data?.created_at).format("DD MMM YYYY, hh:mm A"),
      },
    ],
    []
  );

  return (
    <div className="bg-zui-light p-4">
      <div className="flex items-center mb-2">
        <div className="bg-zui-dark0 p-3  mr-4">
          <CreditCardOutlined className="text-xl" />
        </div>
        <div>
          <Title level={5} className="text-zui-white m-0">
            Payment History ({payments?.length || 0})
          </Title>
          <Text className="text-zui-silver">
            Complete transaction records and payment details
          </Text>
        </div>
      </div>

      {payments && payments.length > 0 ? (
        <ZudTable
          data={payments}
          isLoading={false}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
        />
      ) : (
        <div className="bg-zui-dark p-8 text-center">
          <Empty
            description={
              <span className="text-zui-silver">No payment records found</span>
            }
          />
        </div>
      )}
    </div>
  );
};

export default PaymentInformation;
