import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Card, Divider, Space, Typography, Collapse } from "antd";
import { Booking } from "apps/admin/src/config";
import React, { useMemo } from "react";

interface PaymentInfoSectionProps {
  booking: Booking;
  className?: string;
}

const discountTypeToSymbol = {
  percentage: "%",
  fixed: "₹",
};

const formatPrice = (value: number, decimals: number = 2) => {
  return value
    ? Number(value?.toFixed(decimals)).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : "0";
};

const PaymentInfoSection: React.FC<PaymentInfoSectionProps> = ({
  booking,
  className,
}) => {
  const paymentInfo = useMemo(() => {
    if (booking?.booked_skus && booking?.booked_skus?.length > 0) {
      const discounts: GeneralObject = {};
      const currency = booking?.booked_skus?.[0].sku.currency;

      // Group and sum room prices by room name
      const roomPricesMap = booking?.booked_skus.reduce(
        (
          acc: { [key: string]: { price: number; quantity: number } },
          room: GeneralObject
        ) => {
          const inventory = room.sku.inventory;
          const sku = room.sku;
          const roomName = `${inventory.name} - ${sku.name}`;
          const price = Number(
            (sku.price * Math.pow(10, -currency.decimals)).toFixed(2)
          );

          if (!acc[roomName]) {
            acc[roomName] = { price: 0, quantity: 0 };
          }
          acc[roomName].price += price;
          acc[roomName].quantity += 1;
          return acc;
        },
        {}
      );

      const roomPrices = Object.entries(roomPricesMap).map(
        ([roomName, data]) => ({
          roomName,
          basePrice: data.price,
          quantity: data.quantity,
        })
      );

      const price = Number(
        (booking?.total_amount * Math.pow(10, -currency.decimals)).toFixed(2)
      );
      const taxedPrice = Number(
        (booking?.tax_amount * Math.pow(10, -currency.decimals)).toFixed(2)
      );

      booking?.booked_skus?.forEach((item: GeneralObject) => {
        if (item.offer) {
          const offerName = item.offer.name;
          if (!discounts[offerName]) {
            discounts[offerName] = 0;
          }
          const discountAmount =
            item.offer.discount_type === "percentage"
              ? (item.price * item.offer.discount_value) / 100
              : item.offer.discount_value;

          discounts[offerName] = Number(
            (
              discounts[offerName] +
              discountAmount * Math.pow(10, -currency.decimals)
            ).toFixed(2)
          );
        }
      });

      const totalDiscount = booking?.booked_skus
        .flatMap((item: GeneralObject) => item.labels)
        .reduce(
          (sum: number, label: GeneralObject) => sum + label?.discount,
          0
        );

      return {
        roomPrices,
        tax: Number(
          ((taxedPrice - price) * Math.pow(10, -currency.decimals)).toFixed(2)
        ),
        discounts: discounts,
        symbol: currency.symbol,
        totalDiscount:
          totalDiscount > 0
            ? Number(
                (totalDiscount * Math.pow(10, -currency.decimals)).toFixed(2)
              )
            : 0,
      };
    } else {
      return {
        roomPrices: [],
        tax: 0,
        totalDiscount: 0,
        discounts: {},
        symbol: "₹",
      };
    }
  }, [booking]);

  const appliedOffers = useMemo(
    () => booking.booked_skus.map((item: GeneralObject) => item.offer),
    [booking]
  );

  const currency = booking?.booked_skus?.[0].sku.currency;

  const totalTax = useMemo(() => {
    const taxByCategory = booking.booked_skus
      .map((item) => item.tax_details)
      .flat()
      .reduce((acc: Record<string, number>, item) => {
        const category = item.category;
        acc[category] = (acc[category] || 0) + item.tax_amount;
        return acc;
      }, {});
    return taxByCategory;
  }, [booking.booked_skus]);

  const otherPaymentKeys = [
    "due_amount",
    "advance_amount",
    "paid_amount",
    "refund_amount",
  ];

  const toPay = Number(
    (booking.advance_amount - booking.paid_amount).toFixed(2)
  );

  const paymentContent = (
    <Card
      styles={{
        body: { padding: 0, paddingBottom: 16 },
      }}
      className={cn("bg-zui-lighter", className)}
      bordered={false}
    >
      <Space direction="vertical" size="middle" className="w-full">
        {/* Base Price */}
        <div>
          <Typography.Title level={5}>Base Price</Typography.Title>
          {paymentInfo.roomPrices.map((room: GeneralObject) => (
            <div className="flex justify-between my-2" key={room.roomName}>
              <Typography.Text type="secondary">
                {room.roomName} x {room.quantity}
              </Typography.Text>
              <Typography.Text strong>
                {paymentInfo.symbol} {formatPrice(room.basePrice)}
              </Typography.Text>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-lg">
          <Typography.Text type="secondary" strong>
            Total Base Price
          </Typography.Text>
          <Typography.Text strong>
            {paymentInfo.symbol}{" "}
            {formatPrice(
              paymentInfo.roomPrices.reduce(
                (total, room) => total + room.basePrice,
                0
              )
            )}
          </Typography.Text>
        </div>
        <Divider className="my-3" dashed />

        {/* Discounts */}
        {appliedOffers.length > 0 && (
          <div>
            <Typography.Title level={5}>Discounts</Typography.Title>
            {[
              ...new Map(
                appliedOffers.map((offer) => [offer?.name, offer])
              ).values(),
            ].map(
              (offer: GeneralObject) =>
                isValidString(offer?.name) && (
                  <div className="flex justify-between my-2" key={offer?.name}>
                    <Typography.Text type="secondary">
                      {offer?.name}
                    </Typography.Text>
                    <Typography.Text strong type="success">
                      {formatPrice(offer?.discount_value)}
                      {
                        discountTypeToSymbol[
                          offer?.discount_type as keyof typeof discountTypeToSymbol
                        ]
                      }
                    </Typography.Text>
                  </div>
                )
            )}
            <div className="flex justify-between mt-4">
              <Typography.Text type="secondary" strong>
                Total Discount
              </Typography.Text>
              <Typography.Text type="success" strong>
                {paymentInfo.symbol}
                {formatPrice(
                  booking.offer_discount * Math.pow(10, -currency.decimals)
                )}
              </Typography.Text>
            </div>
          </div>
        )}

        <Divider className="my-3" dashed />

        {/* Taxes */}
        <div>
          <Typography.Title level={5}>Taxes & Fees</Typography.Title>
          {Object.entries(totalTax).map(([category, taxAmount]) => (
            <div className="flex justify-between my-2" key={category}>
              <Typography.Text type="secondary">
                {formatCapitalize(category)}
              </Typography.Text>
              <Typography.Text strong>
                {paymentInfo.symbol}
                {formatPrice(taxAmount * Math.pow(10, -currency.decimals))}
              </Typography.Text>
            </div>
          ))}
        </div>

        <Divider className="my-3" dashed />

        {/* Payment Summary */}
        <div>
          <Typography.Title level={5}>Payment Summary</Typography.Title>
          {otherPaymentKeys.map((key: string) => (
            <div className="flex justify-between my-2" key={key}>
              <Typography.Text type="secondary">
                {formatCapitalize(key)}
              </Typography.Text>
              <Typography.Text strong>
                {paymentInfo.symbol}
                {formatPrice(
                  Number(booking?.[key as keyof Booking]) *
                    Math.pow(10, -currency.decimals)
                )}
              </Typography.Text>
            </div>
          ))}
        </div>

        <Divider className="my-3" dashed />

        {/* Final Amount */}
        <div className="flex justify-between items-center">
          <Typography.Title level={4} type="secondary" style={{ margin: 0 }}>
            To Pay
          </Typography.Title>
          <Typography.Title
            level={4}
            type={toPay > 0 ? "danger" : "success"}
            style={{ margin: 0 }}
          >
            {paymentInfo.symbol}
            {formatPrice(toPay * Math.pow(10, -currency.decimals))}
          </Typography.Title>
        </div>
      </Space>
    </Card>
  );

  return (
    <div className="mt-10">
      <Collapse
        defaultActiveKey={["1"]}
        ghost
        style={{
          padding: 0,
        }}
        className="payment-info-collapse"
        expandIconPosition="end"
        items={[
          {
            key: "1",
            label: (
              <Typography.Text
                strong
                type="secondary"
                style={{ textTransform: "uppercase", fontSize: "16px" }}
              >
                Payment Information
              </Typography.Text>
            ),
            children: paymentContent,
          },
        ]}
      />
    </div>
  );
};

export default PaymentInfoSection;
