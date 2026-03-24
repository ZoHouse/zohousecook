import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Drawer } from "antd";
import { AddTripBatchDateOfferSidebar } from "apps/admin/src/components/sidebars";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";
import dayjs from "dayjs";
import { useState } from "react";
import { StatusCell } from "../ui";

interface TripBatchDateOffer {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
}

const TripBatchDateOffer: React.FC<TripBatchDateOffer> = ({
  isOpen,
  onClose,
  batchId,
}) => {
  const [offers, setOffers] = useState<GeneralObject[]>([]);
  const [isAddOfferVisible, showAddOffer, hideAddOffer] = useVisibilityState();
  const [offerId, setOfferId] = useState(null);

  const { refetch, isLoading } = useInfiniteTable({
    setter: setOffers,
    queryEndpoint: "CAS_OFFERS",
    name: "offers",
    enabled: isOpen,
    customSearchQuery: `applicable_skus=${batchId}`,
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
      render: (v) => <StatusCell status={String(v)} />,
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
      render: (cell, row) => {
        if (cell == null) return "-";
        if (row?.discount_type === "percentage") {
          return `${cell}%`;
        }
        return formatCurrencyPrice(cell, row?.currency);
      },
    },
    {
      key: "max_discount_value",
      title: "Max Discount Value",
      dataIndex: "max_discount_value",
      render: (cell, row) => {
        return cell != null ? formatCurrencyPrice(cell, row?.currency) : "-";
      },
    },
    {
      key: "min_booking_start_at",
      title: "Min Booking Start At",
      dataIndex: "min_booking_start_at",
      width: 150,
      render(cell, row, index) {
        return cell ? dayjs(cell).format("DD MMM YYYY") : "-";
      },
    },
    {
      key: "max_booking_start_at",
      title: "Max Booking Start At",
      dataIndex: "max_booking_start_at",
      width: 150,
      render(cell, row, index) {
        return cell ? dayjs(cell).format("DD MMM YYYY") : "-";
      },
    },
    {
      key: "applicable_after",
      title: "Applicable After",
      dataIndex: "applicable_after",
      width: 150,
      render(cell, row, index) {
        return cell ? dayjs(cell).format("DD MMM YYYY") : "-";
      },
    },
    {
      key: "applicable_before",
      title: "Applicable Before",
      dataIndex: "applicable_before",
      width: 150,
      render(cell, row, index) {
        return cell ? dayjs(cell).format("DD MMM YYYY") : "-";
      },
    },
    {
      key: "discount_type",
      title: "Discount Type",
      dataIndex: "discount_type",
    },
    {
      key: "currency",
      title: "Currency",
      dataIndex: "currency",
      width: 100,
      render(cell, row, index) {
        return cell ? cell.name : "-";
      },
    },
    {
      key: "min_booked_units",
      title: "Min Booked Units",
      dataIndex: "min_booked_units",
      width: 150,
      render(cell, row, index) {
        return cell ? cell : "-";
      },
    },
    {
      key: "max_booked_units",
      title: "Max Booked Units",
      dataIndex: "max_booked_units",
      width: 150,
      render(cell, row, index) {
        return cell ? cell : "-";
      },
    },
    {
      key: "applicable_on_weekdays",
      title: "Applicable On Weekdays",
      dataIndex: "applicable_on_weekdays",
      width: 150,
      render(cell, row, index) {
        return cell ? cell.join(", ") : "-";
      },
    },
  ];

  const handleRowClick = (data: GeneralObject) => {
    if (data?.id) {
      setOfferId(data?.id);
      showAddOffer();
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleOfferSidebarClose = () => {
    hideAddOffer();
    setOfferId(null);
  };

  return (
    <Drawer
      open={isOpen}
      width={1080}
      onClose={handleClose}
      title="Batch Date Offer"
      extra={
        <Button type="primary" onClick={showAddOffer}>
          Add Offer
        </Button>
      }
    >
      <ZudTable
        data={offers || []}
        isLoading={isLoading}
        columns={columns}
        keyExtractor={(row) => row.id.toString()}
        onRowClick={(record) => handleRowClick(record)}
      />
      <AddTripBatchDateOfferSidebar
        isOpen={isAddOfferVisible}
        offerId={offerId}
        batchId={batchId}
        refetch={refetch}
        onClose={handleOfferSidebarClose}
      />
    </Drawer>
  );
};

export default TripBatchDateOffer;
