import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import {
  ZudColumnType,
  ZudFilterOptions,
  ZudFilterOptionType,
  ZudTable,
} from "@zo/zud";

import { CheckCircleOutlined } from "@ant-design/icons";
import {
  Page,
  PageContent,
  PageHeader,
  useInfiniteTable,
  UserMini,
} from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { Button, message, Statistic, Tag } from "antd";
import {
  AddTripBookingSidebar,
  BatchBookingDetailsSidebar,
} from "apps/admin/src/components/sidebars";
import { StatusTag } from "apps/admin/src/components/ui";
import { bookingStatusColors } from "apps/admin/src/config";
import { formatPrice } from "apps/admin/src/utils/formatPrice";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const statusColors: Record<string, string> = {
  requested: "processing",
  pending: "warning",
  confirmed: "success",
  cancelled: "error",
  abandoned: "orange",
};

const TripBookings: NextPage = () => {
  const router = useRouter();
  const { tripId } = router.query;
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookings, setBookings] = useState<GeneralObject[]>([]);
  const [showApproveButton, setShowApproveButton] = useState(false);

  const [isAddBookingVisible, showAddBooking, hideAddBooking] =
    useVisibilityState();

  const breadcrumbs = [
    { href: "/trips", label: "Trips" },
    {
      href: `/trips/${tripId}/bookings`,
      label: "Bookings",
    },
  ];

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

  const { refetch, data: batches } = useQueryApi<any[]>(
    "CAS_SKU",
    {
      enabled: !!tripId,
      select: (data) => data.data.results,
    },
    ``,
    `inventory=${tripId}`
  );

  const { mutate: batchApprove } = useMutationApi(
    "CAS_TRIP_BOOKINGS",
    {},
    "",
    "POST"
  );

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
        const totalCustomers = bookedSkus?.length || 0;
        return (
          <span className="whitespace-nowrap">
            {totalCustomers} {totalCustomers === 1 ? "guest" : "guests"}
          </span>
        );
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

  const handleRowClick = (row: GeneralObject) => {
    showBookingDetails();
    router.push(
      combineRouteAndQueryParams(
        `/trips/${tripId}/bookings/${row.id}`,
        router.query,
        true
      ),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleClose = (batchId?: string, startDate?: string) => {
    hideBookingDetails();
    const query: any = {};

    if (batchId) {
      query["bookings-sku_id"] = batchId;
    }

    if (startDate) {
      query["bookings-start_at__date"] = startDate;
    }

    if (Object.keys(query).length > 0) {
      router.push(
        {
          pathname: `/trips/${tripId}/bookings`,
          query,
        },
        undefined,
        { shallow: true }
      );
    } else {
      router.push(
        {
          pathname: `/trips/${tripId}/bookings`,
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const handleAddClick = () => {
    showAddBooking();

    router.push(`/trips/${tripId}/booking/new`, undefined, {
      shallow: true,
    });
  };

  const availabilityOptions = useMemo(() => {
    return availability.map((item) => ({
      label: moment(item.date).format("DD MMM YYYY"),
      value: item.date,
    }));
  }, [availability]);

  const batchOptions = useMemo(() => {
    if (!batches || batches.length === 0) return [];

    return batches.map((batch) => ({
      label: `${batch.name} - ${batch.itinerary?.title || "No Itinerary"}`,
      value: batch.itinerary.id,
    }));
  }, [batches]);

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
      {
        type: "select",
        key: "booked_skus__sku__itinerary",
        className: "w-fit md:w-64",
        placeholder: "Select Batch",
        options: [
          {
            label: "All Batches",
            value: "null",
          },
          ...batchOptions,
        ],
      },
      {
        type: "select",
        key: "start_at__date",
        className: "w-fit md:w-64",
        placeholder: "Select Date",
        options: [
          {
            label: "All Date",
            value: "null",
          },
          ...availabilityOptions,
        ],
      },
    ],
    [bookingStatus, batchOptions, availabilityOptions]
  );

  const { data, refetch: refetchTrip } = useQueryApi<any>(
    "CAS_INVENTORY",
    {
      enabled: isValidString(tripId as string),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${tripId}/`,
    ""
  );

  const { isLoading: isLoadingBatches } = useInfiniteTable({
    setter: setAvailability,
    queryEndpoint: "CAS_SKU",
    customSearchQuery: `type=trip`,
    name: "trips",
    enabled: isValidString(data?.skus[0]?.id),
    additionalRoute: `${data?.skus[0]?.id}/availability/`,
  });

  const { refetch: refetchBookings, isLoading } = useInfiniteTable({
    setter: setBookings,
    queryEndpoint: "CAS_TRIP_BOOKINGS",
    name: "bookings",
    filterOptions: filterOptions,
    enabled: isValidString(tripId as string),
    customSearchQuery: `inventory_id=${tripId}`,
  });

  const bookingStats = useMemo(() => {
    return {
      total: bookings?.length,
      confirmed: bookings?.filter((booking) => booking.status === "confirmed")
        ?.length,
      cancelled: bookings?.filter((booking) => booking.status === "cancelled")
        ?.length,
    };
  }, [bookings]);

  const checkForBatchFilter = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const batchIdParam = searchParams.get("bookings-sku_id");
    const dateParam = searchParams.get("bookings-start_at__date");
    const statusParam = searchParams.get("bookings-status");

    // Show approve button when batch or date is selected and status is "requested" or no status
    setShowApproveButton(
      (!!batchIdParam || !!dateParam) &&
        (statusParam === "requested" || !statusParam)
    );
  };

  useEffect(() => {
    checkForBatchFilter();
  }, [batches, bookingStats.total, bookingStats.confirmed]);

  const handleApproveAllCustomers = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedBatchId = searchParams.get("bookings-sku_id");
    const selectedDate = searchParams.get("bookings-start_at__date");

    const approvalData: any = { trip_id: tripId };

    if (selectedBatchId) {
      approvalData.sku_id = selectedBatchId;
    }

    if (selectedDate) {
      approvalData.batch_date = selectedDate;
    }

    batchApprove(
      {
        data: approvalData,
        route: `batch-approve/`,
      },
      {
        onSuccess() {
          message.success("Bookings have been approved");
          refetchBookings();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Page breadCrumbs={breadcrumbs}>
      <PageHeader
        title="Trip Bookings"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Trip Booking",
            onClick: handleAddClick,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between space-x-6 mb-6">
            <Statistic title="Total Bookings" value={bookingStats.total} />
            <Statistic title="Confirmed" value={bookingStats.confirmed} />
            <Statistic title="Cancelled" value={bookingStats.cancelled} />
          </div>
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

            {showApproveButton && (
              <div className="flex flex-col items-center gap-1">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApproveAllCustomers()}
                >
                  Approve All Customers
                </Button>
              </div>
            )}
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
            refetch={refetchBookings}
          />

          <AddTripBookingSidebar
            isOpen={isAddBookingVisible}
            onClose={hideAddBooking}
            refetch={refetchBookings}
          />
        </div>
      </PageContent>
    </Page>
  );
};

export default TripBookings;
