import { DeleteOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Drawer, message } from "antd";
import dayjs from "dayjs";
import { FC, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { formatPrice } from "../../utils/formatPrice";
import BatchAddonSidebar from "./BatchAddonSidebar";

interface TripDateAddonProps {
  selectedDate: GeneralObject;
  inventoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TripDateAddon: FC<TripDateAddonProps> = ({
  selectedDate,
  inventoryId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [isAddAddonVisible, showAddAddon, hideAddAddon] = useVisibilityState();
  const [addonsPrices, setAddOnsPrices] = useState<GeneralObject[]>([]);

  const { mutate: updateAddons } = useMutationApi(
    "CAS_ADDONS_PRICES",
    {},
    "",
    "PATCH"
  );

  const { refetch: refetchAddonsPrices, isLoading } = useInfiniteTable({
    setter: setAddOnsPrices,
    queryEndpoint: "CAS_ADDONS_PRICES",
    customSearchQuery: `date=${
      selectedDate ? selectedDate.date : ""
    }&status=active&addon__inventory=${inventoryId}`,
    name: "addons_prices",
    enabled: isOpen && !!selectedDate?.priceData?.date,
  });

  const handleDeleteAddon = (addonId: string) => {
    updateAddons(
      {
        data: {},
        route: `${addonId}/inactive/`,
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({
            queryKey: ["cas", "addons", "prices"],
          });
          refetchAddonsPrices();
          message.success("Addon updated successfully");
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "name",
        title: "Name",
        dataIndex: "addon",
        render: (addon: any) => <span>{addon.name}</span>,
      },

      {
        title: "Price",
        dataIndex: "price",
        key: "price",
        render: (price) => {
          const currency = selectedDate?.priceData?.currency;
          return <span>{currency && formatPrice(price, currency)}</span>;
        },
      },

      {
        title: "Start From",
        dataIndex: "applicable_from",
        key: "applicable_from",
        width: 100,
        render: (date: string) => (
          <span>{dayjs(date).format("DD MMM YYYY")}</span>
        ),
      },
      {
        title: "End Date",
        dataIndex: "applicable_till",
        key: "applicable_till",
        width: 100,
        render: (date) => <span>{dayjs(date).format("DD MMM YYYY")}</span>,
      },
      {
        title: "Actions",
        dataIndex: "id",
        key: "id",
        width: 120,
        render: (cell: any) => (
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => {
              handleDeleteAddon(cell);
            }}
          />
        ),
      },
    ],
    [selectedDate]
  );

  return (
    <div>
      <Drawer
        title="Add Addon"
        placement="right"
        open={isOpen}
        width={640}
        onClose={onClose}
        extra={
          <Button onClick={showAddAddon} type="primary">
            Add Addon
          </Button>
        }
      >
        <PageContent>
          <ZudTable
            data={addonsPrices || []}
            isLoading={isLoading}
            columns={columns}
          />
        </PageContent>
        <BatchAddonSidebar
          inventoryId={inventoryId}
          pricingData={selectedDate?.priceData}
          isOpen={isAddAddonVisible}
          onClose={hideAddAddon}
          refetch={refetchAddonsPrices}
        />
      </Drawer>
    </div>
  );
};

export default TripDateAddon;
