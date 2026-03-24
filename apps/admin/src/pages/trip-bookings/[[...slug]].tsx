import { PlusOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { Page, PageContent, PageHeader, UserMini } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { combineRouteAndQueryParams, formatCapitalize } from "@zo/utils/string";
import moment from "moment";
import { useMemo, useState } from "react";
import {
  AddTripBookingSidebar,
  BatchBookingDetailsSidebar,
} from "../../components/sidebars";
import { StatusTag } from "../../components/ui";

import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import {
  ZudColumnType,
  ZudFilterOptions,
  ZudFilterOptionType,
  ZudTable,
} from "@zo/zud";
import { Tag, Tooltip } from "antd";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { formatPrice } from "../../utils/formatPrice";

interface TripBookingProps {}

const statusColors: Record<string, string> = {
  requested: "processing",
  pending: "warning",
  confirmed: "success",
  cancelled: "error",
  abandoned: "orange",
};

const TripBooking: NextPage<TripBookingProps> = () => {
  const router = useRouter();

  const [bookings, setBookings] = useState<GeneralObject[]>([]);

  const [isAddBookingVisible, showAddBooking, hideAddBooking] =
    useVisibilityState();

  const [isBookingDetailsVisible, showBookingDetails, hideBookingDetails] =
    useVisibilityState();

  const { data: bookingStatus } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      const excludedStatuses = ["checkin", "checkout", "noshow"];
      return data.data.booking.status
        .filter((item: string) => !excludedStatuses.includes(item))
        .map((item: any) => ({
          label: formatCapitalize(item),
          value: item,
        }));
    },
  });

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "status",
        className: "w-fit md:w-48",
        placeholder: "Status",
        options: [
          {
            label: "All Status",
            value: "null",
          },
          ...(bookingStatus || []),
        ],
      },
    ],
    [bookingStatus]
  );

  const { refetch, isLoading } = useInfiniteTable({
    setter: setBookings,
    queryEndpoint: "CAS_TRIP_BOOKINGS",
    name: "bookings",
    enabled: true,
    filterOptions: filterOptions,
  });

  const columns: ZudColumnType[] = [
    {
      key: "Guest",
      title: "Customers",
      dataIndex: "customers",
      render: (cell) => {
        if (!cell || !Array.isArray(cell) || cell.length === 0) return null;
        const lastCustomer = cell[cell.length - 1];
        return <UserMini data={lastCustomer} />;
      },
    },

    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (cell: any, row: any) => {
        return (
          <Tag bordered={false} color={statusColors[cell] || "default"}>
            {formatCapitalize(cell)}
          </Tag>
        );
      },
    },

    {
      title: "Guests",
      dataIndex: "booked_skus",
      key: "booked_skus",
      width: 100,
      render: (bookedSkus: any[]) => {
        const confirmedSkus = bookedSkus?.filter((sku: any) => sku.status === "confirmed") ?? [];
        const cancelledSkus = bookedSkus?.filter((sku: any) => sku.status === "cancelled") ?? [];
        const totalSkuCount = bookedSkus?.length ?? 0;
        
        const hasPartialCancellation = confirmedSkus.length > 0 && cancelledSkus.length > 0;
        const count = hasPartialCancellation ? confirmedSkus.length : totalSkuCount;
        const label = `${count} ${count === 1 ? "guest" : "guests"}`;
        
        return hasPartialCancellation
          ? <Tooltip title={`Originally ${totalSkuCount} guests`}>
              <span>
                <Tag bordered={false} color="blue">{label}</Tag>
              </span>
            </Tooltip>
          : <span className="whitespace-nowrap">{label}</span>;
      },
    },
    {
      title: "Payment",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (paid_amount: number, row: any) => {
        return <div>{formatPrice(paid_amount, row.currency)}</div>;
      },
    },
    {
      title: "Start",
      dataIndex: "start_at",
      key: "start_at",
      width: 100,
      render: (date: string) => (
        <span title={moment(date).format("LLL")}>
          {moment(date).startOf("day").fromNow()}
        </span>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date: string) => (
        <span title={moment(date).format("LLL")}>
          {moment(date).format("LLL")}
        </span>
      ),
    },
    {
      title: "Trip",
      dataIndex: "booked_skus",
      key: "booked_skus",
      render: (cell) => {
        const sku = cell?.[0]?.sku;
        const tripName = sku?.inventory?.name;
        const itineraryTitle = sku?.itinerary?.title;
        const groupName = sku?.name;

        return (
          <div className="flex flex-col gap-1">
            {tripName && (
              <span className="font-medium text-sm whitespace-nowrap">
                {tripName}
              </span>
            )}
            <div className="flex flex-col text-xs text-zui-silver">
              {itineraryTitle && (
                <span className="whitespace-nowrap">{itineraryTitle}</span>
              )}
              {groupName && (
                <span className="whitespace-nowrap">Group {groupName}</span>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const handleClose = () => {
    router.push(
      {
        pathname: `/trip-bookings`,
      },
      undefined,
      { shallow: true }
    );
    hideBookingDetails();
  };

  const handleRowClick = (row: GeneralObject) => {
    showBookingDetails();
    router.push(
      combineRouteAndQueryParams(
        `/trip-bookings/${row.id}`,
        router.query,
        true
      ),
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <Page>
      <PageHeader
        title="Trip Bookings"
        buttons={[
          {
            icon: <PlusOutlined />,
            label: "Add Trip Booking",
            onClick: showAddBooking,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center space-x-6 mb-6 border-t border-zui-light pt-6">
            <div className="flex gap-4">
              {filterOptions && (
                <ZudFilterOptions
                  name="bookings"
                  options={filterOptions}
                  className="mb-0"
                />
              )}
            </div>
          </div>
          <ZudTable
            data={bookings || []}
            isLoading={isLoading}
            columns={columns}
            keyExtractor={(row) => row.id.toString()}
            onRowClick={handleRowClick}
          />
          <BatchBookingDetailsSidebar
            isOpen={isBookingDetailsVisible}
            onClose={handleClose}
            refetch={refetch}
            bookingId={router.query.slug?.[0]}
          />
          <AddTripBookingSidebar
            isOpen={isAddBookingVisible}
            onClose={hideAddBooking}
            refetch={refetch}
          />
        </div>
      </PageContent>
    </Page>
  );
};

export default TripBooking;