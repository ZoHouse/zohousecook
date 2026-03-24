import { PlusOutlined } from "@ant-design/icons";
import { GeneralObject } from "@zo/definitions/general";
import type { CollapseProps } from "antd";
import { Alert, Button, Collapse } from "antd";
import { Currency, Inventory, Space } from "apps/admin/src/config";
import React from "react";
import SkuCard from "./SkuCard";

export type SkuAccordionType = {
  id?: string;
  name: string;
  price: number;
  sellable: boolean;
  space: string | Space;
  inventory?: Inventory;
  units: number;
  currency?: Currency;
  slabs: Array<[number, number]>;
};

interface SkuAccordionProps {
  onAddClick: () => void;
  skus: SkuAccordionType[];
  onClick?: (sku: GeneralObject) => void;
  onDelete: (skuId: string) => void;
  currency?: Currency;
  inventoryType?: "stay" | "utility";
}

const SkuAccordion: React.FC<SkuAccordionProps> = ({
  onAddClick,
  currency,
  onClick,
  onDelete,
  skus = [],
  inventoryType,
}) => {
  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "SKUs",

      children: (
        <div>
          <Alert
            message="SKUs represent available beds with different pricing options."
            type="info"
            showIcon
          />

          <div className="space-y-2 mt-4 mb-2">
            {skus.map((sku) => (
              <SkuCard
                currency={currency}
                key={sku.id}
                onClick={onClick && onClick.bind(null, sku)}
                onDelete={onDelete.bind(null, sku.id || "")}
                sku={sku}
                inventoryType={inventoryType}
              />
            ))}
          </div>

          <Button
            className="mt-4"
            icon={<PlusOutlined />}
            onClick={onAddClick}
            variant="filled"
          >
            Add SKU
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Collapse
      items={items}
      size="large"
      className="w-full mt-2 bg-zui-dark"
      accordion
      bordered
    />
  );
};

export default SkuAccordion;
