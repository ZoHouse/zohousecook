import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { Price, Sku } from "apps/admin/src/config";
import React, { useMemo, useState } from "react";
import { SkuAvailability } from "../../../config";
import { Card, Image, message } from "antd";
import Meta from "antd/es/card/Meta";

interface RoomCardProps {
  data: Sku;
  onSelect: (room: any) => void;
  className?: string;
  selected?: boolean;
  priceData: Price[] | undefined;
  availabilityData: SkuAvailability[] | undefined;
  inventoryType: "stay" | "utility";
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/8cc7fea5-927f-48a2-9083-f919657d0d0a_20241124074205.svg";

const RoomCard: React.FC<RoomCardProps> = ({
  data,
  onSelect,
  className,
  selected,
  priceData,
  availabilityData,
  inventoryType,
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  const calculateFInalStayPrice = () => {
    if (priceData && priceData?.length > 0) {
      const finalPrice = priceData?.reduce((total: number, item: Price) => {
        const finalPrice = item.price * Math.pow(10, -item.currency.decimals);
        return total + finalPrice;
      }, 0);
      return {
        price: finalPrice,
        symbol: priceData[0].currency.symbol,
      };
    } else {
      return {
        price: 0,
        symbol: "₹",
      };
    }
  };

  const calculateFinalUtilityPrice = () => {
    if (priceData && priceData.length > 0) {
      const firstPrice =
        priceData[0].price * Math.pow(10, -priceData[0].currency.decimals);
      return {
        price: firstPrice,
        symbol: priceData[0].currency.symbol,
      };
    } else {
      return {
        price: 0,
        symbol: "₹",
      };
    }
  };

  const finalPriceData = useMemo(() => {
    if (inventoryType === "stay") {
      return calculateFInalStayPrice();
    } else {
      return calculateFinalUtilityPrice();
    }
  }, [priceData, inventoryType]);

  const isAvailable = useMemo(
    () =>
      availabilityData && availabilityData.length > 0
        ? availabilityData?.every((availability) => availability.units > 0)
        : false,
    [availabilityData]
  );

  const handleClick = () => {
    if (isAvailable) {
      onSelect(data);
    } else {
      message.info("This room is not available for the selected dates");
    }
  };

  return (
    <Card
      key={data.id}
      hoverable
      onClick={handleClick}
      className={cn(
        "border border-zui-light w-full aspect-square",
        selected && "outline outline-1 outline-zui-neon"
      )}
      cover={
        <div className={cn("bg-transparent overflow-hidden h-32")}>
          <Image
            src={
              !imageError && data.media[0]?.url
                ? data.media[0]?.url
                : DEFAULT_IMAGE
            }
            alt={data.name || "Zo House"}
            preview={false}
            className="h-full w-full object-fill p-[1px]"
            onError={() => setImageError(true)}
            fallback={DEFAULT_IMAGE}
          />
        </div>
      }
    >
      <Meta
        title={
          <span className="text-zui-silver whitespace-pre-wrap">
            {data?.name || "Inventory"}
          </span>
        }
        description={
          <span className="flex items-center gap-2 text-white">
            {`${finalPriceData.symbol} ${finalPriceData.price?.toLocaleString(
              "en"
            )}`}
            <span
              className={cn(
                "text-sm",
                isAvailable ? "text-zui-neon" : "text-zui-red"
              )}
            >
              {isAvailable ? "Available" : "Not Available"}
            </span>
          </span>
        }
      />
    </Card>
  );
};

export default RoomCard;