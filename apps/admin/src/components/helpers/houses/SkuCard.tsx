import {
  DeleteOutline,
  BedOutlined,
  AttachMoneyOutlined,
  EventAvailableOutlined,
  EventBusyOutlined,
} from "@mui/icons-material";
import { cn } from "@zo/utils/font";
import { Currency } from "apps/admin/src/config";
import { useMemo } from "react";
import { SkuAccordionType } from "./SkuAccordion";
import { Button, Flex, Typography } from "antd";

const { Title, Text } = Typography;

interface SkuCardProps {
  onClick?: () => void;
  onDelete: () => void;
  sku: SkuAccordionType;
  currency?: Currency;
  inventoryType?: "stay" | "utility";
}

const SkuCard: React.FC<SkuCardProps> = ({
  sku,
  onClick,
  onDelete,
  currency,
  inventoryType,
}) => {
  const _currency = currency || sku.currency || { decimals: 8 };

  const formatPrice = (price: number) => {
    return (
      price * Math.pow(10, _currency.decimals ? -_currency?.decimals : -8)
    ).toFixed(2);
  };

  const price = useMemo(() => formatPrice(sku.price), [sku]);

  const handleDelete: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      role="button"
      onClick={onClick}
      className="bg-zui-light w-full p-4 rounded-md transition-shadow duration-200"
    >
      <Flex justify="space-between" align="center">
        <div>
          <Title level={5} className="text-sm font-medium">
            {sku.name}
          </Title>
          <div className="flex items-center gap-1 text-sm text-zui-silver mt-1">
            <AttachMoneyOutlined fontSize="small" />
            <Text className="text-zui-silver">
              {price
                ? `${price}/- per ${inventoryType === "stay" ? "day" : "hour"}`
                : "Free"}
            </Text>
          </div>

          {sku.slabs && sku.slabs.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-zui-silver flex items-center gap-1">
                <EventAvailableOutlined fontSize="small" />
                Price Slabs:
              </p>
              <div className="space-y-1.5">
                {sku.slabs.map((slab, index) => {
                  const [days, price] = slab;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-zui-silver"
                    >
                      <span className="px-2 py-0.5 bg-[#2a2a2a] rounded text-xs">
                        {days} days
                      </span>
                      <span>{formatPrice(price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Button
          type="text"
          onClick={handleDelete}
          className="hover:bg-zui-red/20 p-1 rounded-full transition-colors aspect-square flex-shrink-0 w-4"
          aria-label="Delete SKU"
          icon={<DeleteOutline fontSize="small" className="text-zui-red" />}
        />
      </Flex>

      <div className="mt-3 flex flex-wrap gap-3">
        {sku.units != undefined && (
          <span className="text-sm text-zui-silver flex gap-1 items-center bg-[#2a2a2a] px-2 py-1 rounded">
            <BedOutlined fontSize="small" />
            {sku.units}
          </span>
        )}
        <p
          className={cn(
            "text-sm flex items-center gap-1 bg-[#2a2a2a] px-2 py-1 rounded",
            sku.sellable ? "text-zui-green" : "text-zui-red"
          )}
        >
          {sku.sellable ? (
            <>
              <EventAvailableOutlined fontSize="small" />
              Sellable
            </>
          ) : (
            <>
              <EventBusyOutlined fontSize="small" />
              Non Sellable
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default SkuCard;
