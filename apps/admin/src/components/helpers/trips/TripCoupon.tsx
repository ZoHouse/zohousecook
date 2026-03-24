import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader, useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Tag } from "antd";
import { useState } from "react";
import { TripCouponSidebar } from "../../sidebars";
import { CopyToClipboardField } from "../../ui";

interface TripCouponsProps {
  data: GeneralObject;
}

const formatCurrency = (value: number, decimals: number, symbol: string) => {
  return value
    ? `${symbol}${(value * Math.pow(10, decimals * -1)).toLocaleString()}`
    : "-";
};

const getStatusColor = (status: string) => {
  if (status === "active") return "success";
  if (status === "inactive") return "error";
  if (status === "unpublished") return "warning";
  return "default";
};

const TripCoupon: React.FC<TripCouponsProps> = ({ data }) => {
  const [isTripInfoVisible, showTripInfo, hideTripInfo] = useVisibilityState();

  const [selectedData, setSelectedData] = useState<any>();
  const [coupons, setCoupons] = useState<any[]>([]);

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

  const { refetch: refetchCoupons, isLoading } = useInfiniteTable({
    setter: setCoupons,
    queryEndpoint: "CAS_COUPONS",
    name: "coupons",
    customSearchQuery: `applicable_inventories=${data?.id}`,
  });

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
      render: (v) => (
        <Tag className="capitalize" bordered={false} color={getStatusColor(v)}>
          {String(v)}
        </Tag>
      ),
    },
    {
      key: "code",
      title: "Code",
      dataIndex: "code",
      render: (cell) => <CopyToClipboardField text={cell} />,
    },
    {
      key: "discount_type",
      title: "Discount Type",
      dataIndex: "discount_type",
    },
    {
      key: "discount_value",
      title: "Discount Value",
      dataIndex: "discount_value",
      render: (cell, row) =>
        formatCurrency(cell, row.currency.decimals, row.currency.symbol),
    },
    {
      key: "max_discount_value",
      title: "Max Discount Value",
      dataIndex: "max_discount_value",
      render: (cell, row) =>
        formatCurrency(cell, row.currency.decimals, row.currency.symbol),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Trip Coupon"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Coupon",
            onClick: handleAddNew,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <ZudTable
          data={coupons || []}
          isLoading={isLoading}
          columns={columns}
          onRowClick={(record) => {
            handleRowClick(record);
          }}
        />
      </PageContent>

      <TripCouponSidebar
        isOpen={isTripInfoVisible}
        onClose={handleClose}
        setSelectedData={setSelectedData}
        refetch={refetchCoupons}
        inventoryId={data?.id}
        couponId={selectedData?.id}
      />
    </div>
  );
};

export default TripCoupon;
