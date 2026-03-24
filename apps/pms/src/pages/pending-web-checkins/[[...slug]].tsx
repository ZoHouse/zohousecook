import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { CollapsibleSearch, Statistic, useInfiniteTable } from "@zo/moal";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  BookingInfoSidebar,
  CheckinFetchSidebar,
  CheckinQRSidebar,
  ExistingGuestFetchSidebar,
  ManualCheckinSidebar,
} from "../../components/sidebars";
import { Page, PageContent, PageHeader } from "../../components/ui";
import NoAccess from "../../components/ui/NoAccess";
import { useAssociation } from "../../hooks";
import { getBookingWebCheckedInInfo } from "../../utils";

const PendingWebCheckins: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("front-desk-manager");
  const router = useRouter();

  const [data, setData] = useState<GeneralObject[]>([]);
  const [selectedQRBooking, setSelectedQRBooking] = useState<{
    operatorCode: string;
    bookingCode?: string;
  }>({
    operatorCode: "",
  });
  const [manualCheckinObject, setManualCheckinObject] = useState<{
    booking: GeneralObject;
    checkin?: GeneralObject;
  }>({
    booking: {},
  });
  const [checkinFetcher, setCheckinFetcher] = useState<GeneralObject>({});
  const [existingGuestCheckin, setExistingGuestCheckin] =
    useState<GeneralObject>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);

  const breadCrumbs = [
    {
      text: "Pending Web Check-ins",
      to: "/pending-web-checkins",
    },
  ];

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    GeneralObject[]
  >(
    "ADMIN_PM_BOOKING_SEARCH",
    {
      enabled:
        isValidString(searchQuery.trim()) &&
        searchQuery.trim().length > 2 &&
        isValidObject(selectedOperator) &&
        canView,
      onSuccess: (data) => {
        setSearchResults(data.data || []);
      },
    },
    "",
    `operator=${
      selectedOperator?.id
    }&ordering=-start_date&q=${searchQuery}&start_date__gt=2024-07-15&start_date__lt=${moment().format(
      "YYYY-MM-DD"
    )}`
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      removeSearchResults();
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const {
    data: selectedBooking,
    refetch: refetchSelectedBooking,
    isLoading: isLoadingSelectedBooking,
    isRefetching: isRefetchingSelectedBooking,
  } = useQueryApi<GeneralObject>(
    "ADMIN_PM_BOOKINGS",
    {
      enabled: isValidString(router.query.slug?.[0]) && canView,
      select: (data) => data?.data,
    },
    `${router.query.slug?.[0]}/`
  );

  const hideSelectedBooking = () => {
    router.push("/pending-web-checkins", undefined, { shallow: true });
  };

  const handleRowClick = (row: GeneralObject) => {
    router.push(`/pending-web-checkins/${row.code}`, undefined, {
      shallow: true,
    });
  };

  const refetchAndUpdateBooking = () => {
    setTimeout(async () => {
      const { data: newSelectedBooking } = await refetchSelectedBooking();
      setData((prev) =>
        prev.map((b) =>
          b.code === selectedBooking?.code ? { ...newSelectedBooking } : b
        )
      );
      setSearchResults((prev) =>
        prev.map((b) =>
          b.code === selectedBooking?.code ? { ...newSelectedBooking } : b
        )
      );
    }, 500);
  };

  const { isLoading, reset, count } = useInfiniteTable({
    setter: setData,
    enabled: isValidObject(selectedOperator) && canView,
    queryEndpoint: "ADMIN_PM_BOOKINGS",
    customSearchQuery: `operator=${
      selectedOperator?.id
    }&checkin__isnull=true&ordering=-start_date&${
      selectedOperator?.data?.web_checkin_start_date
        ? `start_date__gt=${selectedOperator?.data?.web_checkin_start_date}&`
        : ""
    }start_date__lt=${moment().format("YYYY-MM-DD")}`,
    name: "arriving",
  });

  useEffect(() => {
    if (isValidObject(selectedOperator)) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperator]);

  const showManualCheckin = (
    booking: GeneralObject,
    checkin?: GeneralObject
  ) => {
    setManualCheckinObject({ booking, checkin });
  };

  const showQR = (operatorCode: string, bookingCode?: string) => {
    setSelectedQRBooking({ operatorCode, bookingCode });
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Guest Name",
        dataIndex: "first_name",
        key: "first_name",
        render: (_, data: GeneralObject) => {
          if (data) {
            if (data.guests.length > 0) {
              const totalOccupancy = data.rooms?.reduce(
                (total: number, room: GeneralObject) =>
                  total + room.occupancy * room.units,
                0
              );
              return (
                <div className="flex flex-col w-40 gap-1">
                  <span className="whitespace-normal text-zui-white font-semibold">
                    {data.guests?.[0].first_name}{" "}
                    {data.guests?.[0].last_name || ""}
                  </span>
                  <span className="text-sm text-zui-white">
                    {totalOccupancy} {totalOccupancy > 1 ? "Guests" : "Guest"}
                  </span>
                </div>
              );
            }
          }
          return <span>-</span>;
        },
      },
      {
        title: "Staying in",
        dataIndex: "inventory_name",
        key: "inventory_name",
        render: (_, data: GeneralObject) => {
          const rooms = data?.rooms.map((room: GeneralObject) => ({
            name: room.name,
            units: room.units,
          }));
          return (
            <div className="flex flex-col w-56 gap-1">
              <span className="flex-1 whitespace-normal font-semibold">
                {rooms
                  .map((r: GeneralObject) =>
                    r.units > 1 || rooms.length > 1
                      ? `${r.name} x ${r.units}`
                      : r.name
                  )
                  .join(", ")}
              </span>
              <span className="text-sm text-zui-white">
                {data?.code}
                {isValidString(data?.meta_details?.ezee_id)
                  ? ` / ${data?.meta_details.ezee_id}`
                  : ""}
              </span>
              {isValidObject(data?.source) && (
                <span className="text-sm text-zui-silver">
                  {data?.source.name}
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: "Check-in → Check-out",
        dataIndex: "checkins",
        key: "checkins",
        render: (_, data: GeneralObject) => (
          <div className="flex items-center gap-2 w-36">
            <span>{moment(data?.start_date).format("DD MMM")}</span>
            <span>→</span>
            <span>{moment(data?.end_date).format("DD MMM")}</span>
          </div>
        ),
      },
      {
        title: "Web Checked-in",
        dataIndex: "web_status",
        key: "web_status",
        render: (_, data: GeneralObject) => {
          const { totalOccupancy, approvedCheckinsCount } =
            getBookingWebCheckedInInfo(data || {});

          return totalOccupancy > 1 ? (
            <div className="flex items-center gap-4">
              {totalOccupancy - approvedCheckinsCount > 0 && (
                <div className="flex items-center gap-2">
                  <span>{totalOccupancy - approvedCheckinsCount}</span>
                  <Icon name="Clock" size="16" fill="rgb(255,158,76)" />
                </div>
              )}
              {approvedCheckinsCount > 0 && (
                <div className="flex items-center gap-2">
                  <span>{approvedCheckinsCount}</span>
                  <Icon name="Check" size="16" fill="#66DF48" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Icon
                name={approvedCheckinsCount === 1 ? "Check" : "Clock"}
                size="16"
                fill={
                  approvedCheckinsCount === 1 ? "#66DF48" : "rgb(255,158,76)"
                }
              />
            </div>
          );
        },
      },
      {
        title: "Checked-in",
        dataIndex: "status",
        key: "status",
        render: (checkin) => {
          const hasCheckedIn = checkin.status === 1;

          return (
            <div className="flex items-center gap-2">
              <Icon
                name={hasCheckedIn ? "Check" : "Clock"}
                size="16"
                fill={hasCheckedIn ? "#66DF48" : "rgb(255,158,76)"}
              />
            </div>
          );
        },
      },
    ],
    []
  );

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page breadCrumbs={breadCrumbs}>
      <PageHeader title="Pending Web Check-ins" />
      <PageContent>
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-4 md:gap-6 w-full">
          <div className="flex items-center gap-6">
            <Statistic
              label="Total Pending Web Check-ins"
              value={
                searchQuery.trim().length > 2 ? searchResults.length : count
              }
            />
          </div>

          <div className="w-full md:w-auto">
            <CollapsibleSearch
              value={searchQuery}
              onChange={setSearchQuery}
              isExpanded
            />
          </div>
        </div>
        <ZudTable
          data={
            searchQuery.trim().length > 2 ? searchResults || [] : data || []
          }
          isLoading={isLoading || isSearching}
          columns={columns}
          keyExtractor={(row) => row.code}
          onRowClick={handleRowClick}
        />
      </PageContent>
      <BookingInfoSidebar
        isOpen={isValidString(router.query.slug?.[0])}
        onClose={hideSelectedBooking}
        isLoadingBooking={isLoadingSelectedBooking}
        refetchBooking={refetchAndUpdateBooking}
        booking={selectedBooking || {}}
        isRefetchingBooking={isRefetchingSelectedBooking}
        showQR={showQR}
        showCheckinFetcher={setCheckinFetcher}
        showExistingGuests={setExistingGuestCheckin}
        showManualCheckin={showManualCheckin}
      />
      <CheckinQRSidebar
        isOpen={isValidString(selectedQRBooking.operatorCode)}
        onClose={setSelectedQRBooking.bind(null, { operatorCode: "" })}
        {...selectedQRBooking}
      />
      <CheckinFetchSidebar
        isOpen={isValidObject(checkinFetcher)}
        onClose={setCheckinFetcher.bind(null, {})}
        booking={checkinFetcher}
        onSuccessfulCheckin={refetchAndUpdateBooking}
        checkinDateRange={`arrival_on=${selectedBooking?.start_date}`}
      />
      <ExistingGuestFetchSidebar
        isOpen={isValidObject(existingGuestCheckin)}
        onClose={setExistingGuestCheckin.bind(null, {})}
        booking={existingGuestCheckin}
        onSuccessfulCheckin={refetchAndUpdateBooking}
        existingCheckinDateRange={`departure_on=${selectedBooking?.start_date}`}
      />
      <ManualCheckinSidebar
        isOpen={isValidObject(manualCheckinObject.booking)}
        refetchBooking={refetchAndUpdateBooking}
        onClose={setManualCheckinObject.bind(null, {
          booking: {},
        })}
        {...manualCheckinObject}
      />
    </Page>
  );
};

export default PendingWebCheckins;
