import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { Card, Divider, Empty, Spin, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

interface RoomPrice {
  roomName: string;
  basePrice: number;
}

interface PriceBreakDownCardProps {
  data?: {
    roomPrices: RoomPrice[];
    tax: number;
    discounts: GeneralObject;
    symbol: string;
    totalDiscount: number;
  };
  className?: string;
  loading?: boolean;
}

const PriceBreakDownCard: React.FC<PriceBreakDownCardProps> = ({
  data,
  className,
  loading = false,
}) => {
  if (
    !loading &&
    (!data || !isValidObject(data) || !data?.roomPrices?.length)
  ) {
    return (
      <Card className={cn("w-full", className)}>
        <Empty description="No price information available" />
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const totalBasePrice = data.roomPrices.reduce(
    (total, room) => total + room.basePrice,
    0
  );
  const finalPrice = totalBasePrice + data.tax - (data.totalDiscount || 0);

  return (
    <Spin spinning={loading} size="small">
      <Card className={cn("w-full", className)}>
        <Title level={5} className="text-zui-silver uppercase mb-4">
          Price Breakup
        </Title>

        {data.roomPrices.map((roomPrice, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <Text>{roomPrice.roomName}</Text>
            <Text>
              {data.symbol} {roomPrice.basePrice.toLocaleString()}
            </Text>
          </div>
        ))}

        {Object.keys(data.discounts).length > 0 && (
          <>
            <Divider className="my-2" />
            {Object.entries(data.discounts).map(([key, discount]) => {
              const discountRatio = totalBasePrice
                ? (discount as number) / totalBasePrice
                : 0;
              return (
                <div
                  className="flex items-start justify-between py-2"
                  key={key}
                >
                  <div>
                    <Text>{key}</Text>
                    <Text type="secondary" className="block text-sm">
                      {parseFloat((discountRatio * 100).toFixed(2))}% OFF
                    </Text>
                  </div>
                  <Text type="success">
                    - {data.symbol}{" "}
                    {(discount as number).toFixed(2).toLocaleString()}
                  </Text>
                </div>
              );
            })}
          </>
        )}

        <Divider className="my-2" />

        <div className="flex items-center justify-between py-2">
          <Text>Taxes</Text>
          <Text>
            {data.symbol} {data.tax.toFixed(2).toLocaleString()}
          </Text>
        </div>

        <Divider className="my-2" dashed />

        <div className="flex items-start justify-between py-2">
          <Title level={4}>To Pay</Title>
          <Title style={{ margin: 0 }} level={4} type="success">
            {data.symbol} {finalPrice.toFixed(2).toLocaleString()}
          </Title>
        </div>
      </Card>
    </Spin>
  );
};

export default PriceBreakDownCard;