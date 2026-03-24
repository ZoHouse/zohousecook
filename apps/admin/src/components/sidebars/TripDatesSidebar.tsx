import {
  CalendarOutlined,
  DollarOutlined,
  FileOutlined,
  GiftOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidUUID } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Drawer, Tag, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import {
  AddTripDateSidebar,
  DateOfferSidebar,
  TripBatchDateInvoiceSidebar,
  TripBatchDateLockSidebar,
  TripBatchDateOfferSidebar,
  TripCostHeadSidebar,
  TripDateAddonSidebar,
} from ".";
import { formatPrice } from "../../utils/formatPrice";

interface TripDatesProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatch: GeneralObject;
  data: GeneralObject;
}

const TripDates: React.FC<TripDatesProps> = ({
  isOpen,
  onClose,
  data,
  selectedBatch,
}) => {
  const router = useRouter();

  const [isDateInfoVisible, showDateInfo, hideDateInfo] = useVisibilityState();
  const [isCostHeadVisible, showCostHead, hideCostHead] = useVisibilityState();
  const [isAddonVisible, showAddon, hideAddon] = useVisibilityState();
  const [isOfferVisible, showOffer, hideOffer] = useVisibilityState();
  const [isDateOfferVisible, showDateOffer, hideDateOffer] =
    useVisibilityState();
  const [isDocumentUploadVisible, showDocumentUpload, hideDocumentUpload] =
    useVisibilityState();

  const [isLockUnitsVisible, showLockUnits, hideLockUnits] =
    useVisibilityState();

  const [selectedDate, setSelectedDate] = useState<any>();
  const [pricing, setPricing] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [locking, setLocking] = useState<any[]>([]);

  const handleClose = () => {
    setSelectedDate(undefined);
    hideDateInfo();
  };

  const handleCostHeadBatchClose = () => {
    setSelectedDate(undefined);
    hideCostHead();
  };

  const handleAddonClose = () => {
    setSelectedDate(undefined);
    hideAddon();
  };

  const handleDocumentUploadClose = () => {
    setSelectedDate(undefined);
    hideDocumentUpload();
  };

  const handleOfferClose = () => {
    setSelectedDate(undefined);
    hideOffer();
  };

  const handleAddNew = () => {
    setSelectedDate(null);
    showDateInfo();
  };

  const handleLockUnitsClose = () => {
    setSelectedDate(undefined);
    hideLockUnits();
  };

  // Combine pricing and availability data
  const combinedData = useMemo(() => {
    // Get all unique dates from all data sources
    const allDates = [
      ...new Set([
        ...pricing.map((p) => p.date),
        ...availability.map((a) => a.date),
        ...locking.map((l) => l.date),
      ]),
    ];

    // Create a single consolidated array using date as the key
    return allDates.map((date) => {
      const priceEntry = pricing.find((p) => p.date === date);
      const availEntry = availability.find((a) => a.date === date);
      const lockEntries = locking.filter((l) => l.date === date);

      const totalUnits = lockEntries.reduce(
        (sum, l) => sum + (l.units ?? l.locked_units ?? 0),
        0
      );

      return {
        date,
        sellable: availEntry?.sellable ?? null,
        priceData: priceEntry ?? null,
        availabilityData: availEntry ?? null,
        lockingData: lockEntries.length > 0 ? { date, totalUnits } : null,
      };
    });
  }, [pricing, availability, locking]);

  const { refetch, isLoading } = useInfiniteTable({
    setter: setPricing,
    queryEndpoint: "CAS_SKU",
    customSearchQuery: `type=trip`,
    name: "trips",
    enabled: isOpen && isValidUUID(selectedBatch?.id),
    additionalRoute: `${selectedBatch?.id}/pricing/`,
  });

  const { refetch: refetchLocking, isLoading: isLoadingLocking } =
    useInfiniteTable({
      setter: setLocking,
      queryEndpoint: "CAS_SKU",
      customSearchQuery: `type=trip`,
      name: "trips",
      enabled: isOpen && isValidUUID(selectedBatch?.id),
      additionalRoute: `${selectedBatch?.id}/locking/`,
    });

  const { refetch: refetchAvailability, isLoading: isLoadingAvailability } =
    useInfiniteTable({
      setter: setAvailability,
      queryEndpoint: "CAS_SKU",
      customSearchQuery: `type=trip`,
      enabled: isOpen && isValidUUID(selectedBatch?.id),
      name: "trips",
      additionalRoute: `${selectedBatch?.id}/availability/`,
    });

  const handleViewBooking = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    router.push(
      {
        pathname: `/trips/${data?.id}/bookings`,
        query: {
          "bookings-sku_id": selectedBatch?.id,
          "bookings-start_at__date": item.date,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleCostHeadBatch = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedDate(item);
    showCostHead();
  };

  const handleRowClick = (record: GeneralObject) => {
    setSelectedDate(record);
    showDateInfo();
  };

  const handleDateAddon = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedDate(item);
    showAddon();
  };

  const handleDocument = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedDate(item);
    showDocumentUpload();
  };

  const handleLockUnits = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedDate(item);
    showLockUnits();
  };

  const handleOffer = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedDate(item);
    showDateOffer();
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "date",
        title: "Duration",
        dataIndex: "date",
        width: 200,
        render: (cell: any, row: any) => {
          const startDate = moment(cell);
          const duration = selectedBatch?.itinerary?.duration || 0;
          const endDate = startDate.clone().add(duration - 1, "days");

          return (
            <div className="space-y-1">
              <span className="font-medium flex flex-col">
                {startDate.format("DD MMM YY")} - {endDate.format("DD MMM YY")}
                <span className="text-xs pl-4 text-zui-silver">
                  {duration} days
                </span>
              </span>
            </div>
          );
        },
      },
      {
        key: "priceData",
        title: "Price",
        dataIndex: "priceData",
        render: (cell: any, row: any) => {
          if (cell) {
            return (
              <div className="flex flex-col">
                <span>{formatPrice(cell?.price, cell?.currency)}</span>
                <span className="text-xs text-zui-silver">
                  {formatPrice(
                    (cell?.price * (selectedBatch?.advance_percent ?? 100)) /
                      100,
                    cell?.currency
                  )}{" "}
                  advance ({selectedBatch?.advance_percent ?? 100}%)
                </span>
              </div>
            );
          }
        },
      },
      {
        key: "availabilityData",
        title: "Units",
        dataIndex: "availabilityData",
        render: (cell: any, row: any) => {
          const baseUnits = cell?.base_units ?? cell?.data?.base_units ?? null;
          const remainingUnits = cell?.units ?? null;
          const bookedUnits =
            baseUnits !== null && remainingUnits !== null
              ? baseUnits - remainingUnits
              : null;

          const displayValue = (val: number | string | null) =>
            val !== null && val !== undefined ? val : "—";

          return (
            <div>
              <div className="flex justify-between items-center ">
                <span className="text-xs  text-zui-silver">Total</span>
                <span>{displayValue(baseUnits)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs  text-zui-silver">Booked</span>
                <span className="text-zui-orange">
                  {displayValue(bookedUnits)}
                </span>
              </div>
              <div className="flex justify-between items-center ">
                <span className="text-xs  text-zui-silver">Available</span>
                <span className="text-zui-green">
                  {displayValue(remainingUnits)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "lockingData",
        title: "Lock Units",
        dataIndex: "lockingData",
        render: (cell: any, row: any) => {
          return (
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold">
                {cell?.totalUnits ?? "—"}
              </span>
              <button
                className="text-zui-neon underline text-sm"
                onClick={(e) => handleLockUnits(e, row)}
              >
                Lock
              </button>
            </div>
          );
        },
      },
      {
        key: "sellable",
        title: "Status",
        dataIndex: "sellable",
        render: (cell: any, row: any) => {
          const statusColors: Record<string, string> = {
            false: "warning",
            true: "success",
          };

          return (
            <Tag bordered={false} color={statusColors[cell] || "default"}>
              {cell === true ? "Sellable" : "Unsellable"}
            </Tag>
          );
        },
      },
      {
        key: "action",
        title: "Action",
        dataIndex: "action",
        render: (cell: any, row: any) => {
          return (
            <div className="flex gap-4 mt-2">
              <Tooltip title="View Bookings" placement="top">
                <CalendarOutlined
                  onClick={(e) => handleViewBooking(e, row)}
                  className="text-zui-silver text-sm"
                />
              </Tooltip>
              <Tooltip title="Addon" placement="top">
                <PlusCircleOutlined
                  onClick={(e) => handleDateAddon(e, row)}
                  className="text-zui-silver text-sm"
                />
              </Tooltip>
              <Tooltip title="Cost Head" placement="top">
                <DollarOutlined
                  onClick={(e) => handleCostHeadBatch(e, row)}
                  className="text-zui-silver text-sm"
                />
              </Tooltip>
              <Tooltip title="Documents" placement="top">
                <FileOutlined
                  onClick={(e) => handleDocument(e, row)}
                  className="text-zui-silver text-sm"
                />
              </Tooltip>
              <Tooltip title="Offer" placement="top">
                <GiftOutlined
                  onClick={(e) => handleOffer(e, row)}
                  className="text-zui-silver text-sm"
                />
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [selectedBatch]
  );

  return (
    <>
      <Drawer
        title={
          <div className="flex flex-col">
            <span className="text-zui-silver">
              Batch {selectedBatch.name} Dates
            </span>
            <span className="text-zui-silver">
              Itinerary: {selectedBatch?.itinerary?.title}
            </span>
          </div>
        }
        open={isOpen}
        onClose={onClose}
        width={1120}
        extra={
          <div className="flex gap-2">
            <Button onClick={showOffer} type="primary">
              Add Offers
            </Button>
            <Button onClick={handleAddNew} type="primary">
              Add Dates
            </Button>
          </div>
        }
      >
        <ZudTable
          data={combinedData || []}
          isLoading={isLoading || isLoadingAvailability}
          columns={columns}
          keyExtractor={(row) => row?.date?.toString()}
          onRowClick={(record) => handleRowClick(record)}
        />
        <AddTripDateSidebar
          selectedBatch={selectedBatch}
          isOpen={isDateInfoVisible}
          onClose={handleClose}
          selectedDate={selectedDate}
          refetch={() => {
            refetch();
            refetchAvailability();
          }}
        />
        <TripBatchDateLockSidebar
          selectedBatch={selectedBatch}
          isOpen={isLockUnitsVisible}
          onClose={handleLockUnitsClose}
          selectedDate={selectedDate?.availabilityData.date}
          refetch={refetchLocking}
        />
        <TripDateAddonSidebar
          selectedDate={selectedDate}
          inventoryId={data?.id}
          isOpen={isAddonVisible}
          onClose={handleAddonClose}
        />
        <TripCostHeadSidebar
          selectedBatch={selectedBatch}
          isOpen={isCostHeadVisible}
          onClose={handleCostHeadBatchClose}
          availabilityData={selectedDate?.availabilityData}
        />
        <TripBatchDateInvoiceSidebar
          batchId={selectedBatch?.id}
          isOpen={isDocumentUploadVisible}
          onClose={handleDocumentUploadClose}
          selectedDate={selectedDate?.availabilityData}
        />
        <TripBatchDateOfferSidebar
          isOpen={isOfferVisible}
          onClose={handleOfferClose}
          batchId={selectedBatch?.id}
        />
        <DateOfferSidebar
          isOpen={isDateOfferVisible}
          onClose={hideDateOffer}
          batchId={selectedBatch?.id}
          selectedDate={selectedDate?.availabilityData?.date}
        />
      </Drawer>
    </>
  );
};

export default TripDates;
