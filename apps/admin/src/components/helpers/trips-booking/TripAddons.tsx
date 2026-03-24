import { PlusOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { Badge, Card, Divider, Switch, Typography } from "antd";
import { formatPrice } from "apps/admin/src/utils/formatPrice";
import React, { useCallback, useMemo } from "react";
import { Currency } from "../../../config";

const { Text } = Typography;

interface TripAddonsProps {
  selectedDate: string | null;
  currency: Currency;
  selectedAddons: string[];
  setSelectedAddons: React.Dispatch<React.SetStateAction<string[]>>;
}

const TripAddons: React.FC<TripAddonsProps> = ({
  selectedDate,
  selectedAddons,
  setSelectedAddons,
  currency,
}) => {
  const { data: tripAddonPrice } = useQueryApi<any[]>(
    "CAS_ADDONS_PRICES",
    {
      enabled: !!selectedDate,
      select: (data) => data.data.results,
    },
    "",
    `date=${selectedDate ?? ""}&status=active`
  );

  /** HANDLE TOGGLE OF ADDON SELECTION */
  const handleToggle = useCallback(
    (addonId: string, checked: boolean) => {
      setSelectedAddons((prev) =>
        checked ? [...prev, addonId] : prev.filter((id) => id !== addonId)
      );
    },
    [setSelectedAddons]
  );

  const addonCards = useMemo(
    () =>
      tripAddonPrice?.map((addon) => {
        const isSelected = selectedAddons.includes(addon?.addon?.id);

        return (
          <Card key={addon?.addon?.id} size="small">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <Text>{addon.addon.name}</Text>
                <div className="mt-1">
                  <Text type="secondary" className="text-sm">
                    {formatPrice(addon.price, currency)}
                  </Text>
                </div>
              </div>
              <Switch
                checked={isSelected}
                onChange={(checked) => handleToggle(addon?.addon?.id, checked)}
                className={isSelected ? "bg-zui-primary" : ""}
              />
            </div>
          </Card>
        );
      }),
    [tripAddonPrice, selectedAddons, currency, handleToggle]
  );

  if (!tripAddonPrice || tripAddonPrice.length === 0) return null;

  return (
    tripAddonPrice.length > 0 && (
      <>
        <Divider />
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <PlusOutlined className="text-base" />
            <Text className="text-base font-semibold">Available Addons</Text>
            <Badge count={tripAddonPrice.length} className="ml-2" />
          </div>
          <div className="space-y-3">{addonCards}</div>
        </div>
      </>
    )
  );
};

export default TripAddons;
