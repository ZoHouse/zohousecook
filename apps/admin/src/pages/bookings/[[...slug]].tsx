import { useQueryApi, useWebSocketConnect } from "@zo/auth";
import { useUpdateSocketResponse } from "@zo/utils/hooks";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidUUID,
} from "@zo/utils/string";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  AddBookingSidebar,
  BookingInfoSidebar,
} from "../../components/sidebars";

import { StatusTag } from "../../components/ui";

import { AddOutlined } from "@mui/icons-material";
import { GeneralObject } from "@zo/definitions/general";
import {
  Page,
  PageContent,
  PageHeader,
  useInfiniteTable,
  UserMini,
} from "@zo/moal";
import {
  ZudColumnType,
  ZudFilterOptions,
  ZudFilterOptionType,
  ZudTable,
} from "@zo/zud";
import { Tabs } from "antd";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { bookingStatusColors } from "../../config";
import { User } from "../../config/typings";

const bookingTypes = ["stay", "utility"];

const Bookings: NextPage = () => {
  const router = useRouter();
  const { socket, disconnect, isConnected } = useWebSocketConnect({
    route: "cas",
  });

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [bookingType, bookingId] = slug;

      return {
        bookingType: bookingType || null,
        bookingId: bookingId || null,
        isCreatingNewBooking: bookingType === "new",
      };
    }
    return {
      bookingType: null,
      bookingId: null,
      isCreatingNewBooking: false,
    };
  }, [router.query]);

  const [activeTab, setActiveTab] = useState<string>("stay");

  const [stayBookings, setStayBookings] = useState<GeneralObject[]>([]);
  const [spaceBookings, setSpaceBookings] = useState<GeneralObject[]>([]);

  useUpdateSocketResponse({
    socket,
    identifier: "booking",
    queryEndpoint: "CAS_STAY_BOOKINGS",
    data: stayBookings,
    setter: setStayBookings,
    enabled: activeTab === "stay",
    handleSocketClose: disconnect,
    isConnected,
  });

  useUpdateSocketResponse({
    socket,
    identifier: "booking",
    queryEndpoint: "CAS_UTILITY_BOOKINGS",
    data: spaceBookings,
    setter: setSpaceBookings,
    enabled: activeTab === "utility",
    handleSocketClose: disconnect,
    isConnected,
  });

  const { data: bookingStatus } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.booking.status.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: allOperatorData } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_OPERATORS",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      select: (data) => {
        return data.data.results.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      },
    },
    "",
    "status=active"
  );

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "operator",
        className: "w-fit md:w-48",
        placeholder: "Operator",
        options: [
          {
            label: "All Operators",
            value: "null",
          },
          ...(allOperatorData || []),
        ],
      },
      {
        type: "select",
        key: "status",
        className: "w-fit md:w-48",
        placeholder: "Status",
        options: [
          {
            label: "All Types",
            value: "null",
          },
          ...(bookingStatus || []),
        ],
      },
    ],
    [allOperatorData, bookingStatus]
  );

  const { isLoading: isLoadingStays, reset } = useInfiniteTable({
    setter: setStayBookings,
    filterOptions: filterOptions,
    queryEndpoint: "CAS_STAY_BOOKINGS",
    name: "bookings",
  });

  const { isLoading: isLoadingSpaces, reset: isReset } = useInfiniteTable({
    setter: setSpaceBookings,
    filterOptions: filterOptions,
    queryEndpoint: "CAS_UTILITY_BOOKINGS",
    name: "bookings",
  });

  const columns: ZudColumnType<GeneralObject>[] = useMemo(
    () => [
      {
        key: "user",
        title: "Guest",
        dataIndex: "user",
        render: (_, record: GeneralObject) => (
          <UserMini data={record.user as User} />
        ),
      },
      {
        key: "booked_skus",
        title: "Room",
        dataIndex: "booked_skus",
        render: (_, record: GeneralObject) => (
          <span className="whitespace-nowrap">
            {record.booked_skus?.[0]?.sku?.inventory?.name}
          </span>
        ),
      },
      {
        key: "start_at",
        title: "Start Date",
        dataIndex: "start_at",
        render: (_, record: GeneralObject) => (
          <span className="whitespace-nowrap">
            {dayjs(record.start_at).format("ddd DD MMM")}
          </span>
        ),
      },
      {
        key: "end_at",
        title: "End Date",
        dataIndex: "end_at",
        render: (_, record: GeneralObject) => (
          <span className="whitespace-nowrap">
            {dayjs(record.end_at).format("ddd DD MMM")}
          </span>
        ),
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        render: (_, record: GeneralObject) => (
          <StatusTag
            value={String(record.status)}
            config={bookingStatusColors}
            textOnly
          >
            {String(record.status)}
          </StatusTag>
        ),
      },
    ],
    [bookingStatus]
  );

  const handleRowClick = (row: GeneralObject) => {
    router.push(
      combineRouteAndQueryParams(
        `/bookings/${activeTab}/${row.id}`,
        router.query,
        true
      ),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const tabItems = [
    {
      key: "stay",
      label: "Stay",
      children: (
        <ZudTable
          data={stayBookings}
          isLoading={isLoadingStays}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={handleRowClick}
        />
      ),
    },
    {
      key: "utility",
      label: "Space",
      children: (
        <ZudTable
          data={spaceBookings}
          isLoading={isLoadingSpaces}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={handleRowClick}
        />
      ),
    },
  ];

  const resetURLParam = () => {
    router.push(
      combineRouteAndQueryParams(`/bookings/${activeTab}`, router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleTabChange = (newTabId: string) => {
    router.push(
      combineRouteAndQueryParams(`/bookings/${newTabId}`, router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleAddBookingClick = () => {
    router.push(combineRouteAndQueryParams("new", router.query), undefined, {
      shallow: true,
    });
  };

  useEffect(() => {
    if (params?.bookingType && bookingTypes.includes(params.bookingType)) {
      setActiveTab(params.bookingType);
    }
  }, [params]);

  return (
    <Page>
      <PageHeader
        title="Bookings"
        buttons={[
          {
            icon: <AddOutlined />,
            label: "Add Booking",
            onClick: handleAddBookingClick,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <ZudFilterOptions name="bookings" options={filterOptions} />

        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />
      </PageContent>

      <AddBookingSidebar
        isOpen={params.isCreatingNewBooking}
        onClose={resetURLParam}
      />
      {activeTab === "stay" && (
        <BookingInfoSidebar
          isOpen={
            params.bookingType === "stay" && isValidUUID(params.bookingId)
          }
          onClose={resetURLParam}
          bookingId={params.bookingId}
          type="stay"
        />
      )}

      {activeTab === "utility" && (
        <BookingInfoSidebar
          isOpen={
            params.bookingType === "utility" && isValidUUID(params.bookingId)
          }
          onClose={resetURLParam}
          bookingId={params.bookingId}
          type="utility"
        />
      )}
    </Page>
  );
};

export default Bookings;
