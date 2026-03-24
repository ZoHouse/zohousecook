import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { Price, Sku } from "apps/admin/src/config";
import React, { useMemo } from "react";
import { SkuAvailability } from "../../../config";

interface UtilityCardProps {
  data: Sku;
  onSelect: (room: any) => void;
  className?: string;
  selected?: boolean;
  priceData: Price[] | undefined;
  availabilityData: SkuAvailability[] | undefined;
}

const UtilityCard: React.FC<UtilityCardProps> = ({
  data,
  onSelect,
  className,
  selected,
  priceData,
  availabilityData,
}) => {
  const finalPriceData = useMemo(() => {
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
  }, [priceData]);

  const isAvailable = useMemo(
    () =>
      availabilityData && availabilityData.length > 0
        ? availabilityData?.every((availability) => availability.units > 0)
        : false,
    [availabilityData]
  );

  return (
    <div
      onClick={isAvailable ? onSelect.bind(null, data) : undefined}
      className={cn(
        "bg-zui-light border-2 border-zui-light cursor-pointer w-full overflow-hidden flex flex-col ",
        isAvailable
          ? "hover:border-zui-silver"
          : "opacity-50 cursor-not-allowed",
        selected ? "border-zui-silver" : "border-transparent",
        className
      )}
    >
      <div className="relative bg-zui-lighter overflow-hidden w-full flex-shrink-0 h-48">
        {isAvailable && (
          <span className="absolute top-0 right-0 p-4">
            <Icon
              name={selected ? "CheckboxChecked" : "CheckBox"}
              size={24}
              fill={selected ? "#CFFF50" : "#fff"}
            />
          </span>
        )}
        {data.media.length > 0 && data.media[0].url ? (
          <img
            className="h-full w-full object-cover"
            src={data.media.length > 0 && data.media[0].url}
            alt="Order"
          />
        ) : (
          <span className="text-zui-silver w-full h-full flex items-center justify-center">
            No Image
          </span>
        )}
      </div>
      <div className="p-4 gap-2 bg-zui-light flex-shrink-0 flex flex-col justify-between">
        <h3>{data?.name}</h3>
        <p className="text-sm">
          <span className="text-zui-silver">{`${
            finalPriceData.symbol
          } ${finalPriceData.price?.toLocaleString("en")} total`}</span>
        </p>
        <span
          className={cn(
            "text-sm",
            isAvailable ? "text-zui-neon" : "text-zui-red"
          )}
        >
          {isAvailable ? "Available" : "Not Available"}
        </span>
      </div>
    </div>
  );
};

export default UtilityCard;