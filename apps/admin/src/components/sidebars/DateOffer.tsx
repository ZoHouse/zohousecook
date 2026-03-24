import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Drawer } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { StatusCell } from "../ui";

interface DateOfferSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  selectedDate: string;
}

const DateOfferSidebar: React.FC<DateOfferSidebarProps> = ({
  isOpen,
  onClose,
  batchId,
  selectedDate,
}) => {
  const [offers, setOffers] = useState<GeneralObject[]>([]);

  const { refetch, isLoading } = useInfiniteTable({
    setter: setOffers,
    queryEndpoint: "CAS_OFFERS",
    name: "offers",
    enabled: isOpen,
    customSearchQuery: `applicable_skus=${batchId}&min_booking_start_at__date__lte=${selectedDate}&max_booking_start_at__date__gte=${selectedDate}`,
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
      key: "discount_value",
      title: "Discount Value",
      dataIndex: "discount_value",
    },
    {
      key: "max_discount_value",
      title: "Max Discount Value",
      dataIndex: "max_discount_value",
      render(cell, row, index) {
        return cell
          ? cell *
              Math.pow(
                10,
                row?.currency.decimals ? row.currency.decimals * -1 : 0
              )
          : "-";
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

  const handleClose = () => {
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      width={1080}
      onClose={handleClose}
      title="Batch Date Offer"
    >
      <ZudTable
        data={offers || []}
        isLoading={isLoading}
        columns={columns}
        keyExtractor={(row) => row.id.toString()}
      />
    </Drawer>
  );
};

export default DateOfferSidebar;
