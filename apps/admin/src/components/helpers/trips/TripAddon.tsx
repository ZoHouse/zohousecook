import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader, useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Tag } from "antd";
import { formatPrice } from "apps/admin/src/utils/formatPrice";
import { useState } from "react";
import { TripAddonSidebar } from "../../sidebars";

interface TripAddOnProps {
  data: GeneralObject;
}

const TripAddOn: React.FC<TripAddOnProps> = ({ data }) => {
  const [isTripInfoVisible, showTripInfo, hideTripInfo] = useVisibilityState();

  const [selectedData, setSelectedData] = useState<any>();
  const [addons, setAddOns] = useState<any[]>([]);

  const handleRowClick = (record: GeneralObject) => {
    setSelectedData(record);
    showTripInfo();
  };

  const handleClose = () => {
    setSelectedData(undefined);
    hideTripInfo();
  };

  const handleAddNew = () => {
    setSelectedData(null);
    showTripInfo();
  };

  const { refetch: refetchPricing, isLoading } = useInfiniteTable({
    setter: setAddOns,
    queryEndpoint: "CAS_ADDONS",
    name: "addons",
    customSearchQuery: `inventory=${data?.id}`,
  });

  const currency = {
    code: "INR",
    id: "INR",
    name: "Indian Rupee",
    decimals: 8,
    symbol: "₹",
  };

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (cell: any, row: any) => {
        const statusColors: Record<string, string> = {
          active: "success",
          inactive: "error",
        };

        return (
          <Tag bordered={false} color={statusColors[cell] || "default"}>
            {formatCapitalize(cell)}
          </Tag>
        );
      },
    },
    {
      key: "vendor",
      title: "Vendor",
      dataIndex: "vendor",
      render: (cell: any) => {
        return <span>{cell?.name || "N/A"}</span>;
      },
    },
    {
      key: "data",
      title: "Price",
      dataIndex: "data",
      render: (cell: any) => {
        return (
          <span>
            {cell?.vendor_price
              ? formatPrice(cell?.vendor_price, currency)
              : "N/A"}
          </span>
        );
      },
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Addon"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Addon",
            onClick: handleAddNew,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <ZudTable
          data={addons || []}
          isLoading={isLoading}
          columns={columns}
          onRowClick={(record) => {
            handleRowClick(record);
          }}
        />
      </PageContent>

      <TripAddonSidebar
        isOpen={isTripInfoVisible}
        onClose={handleClose}
        refetch={refetchPricing}
        inventoryId={data?.id}
        addonData={selectedData}
      />
    </div>
  );
};

export default TripAddOn;
