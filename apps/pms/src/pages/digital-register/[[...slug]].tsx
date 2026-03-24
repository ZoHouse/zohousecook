import * as Sentry from "@sentry/nextjs";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { CollapsibleSearch, Statistic, useInfiniteTable } from "@zo/moal";

import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import {
  ZudColumnType,
  ZudFilterOptions,
  ZudFilterOptionType,
  ZudTable,
} from "@zo/zud";
import dayjs, { Dayjs } from "dayjs";
import { parsePhoneNumber } from "libphonenumber-js";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  DownloadBulkPDF,
  DownloadCSV,
} from "../../components/helpers/digital-register";
import { CheckinInfoSidebar } from "../../components/sidebars";
import { Page, PageContent, PageHeader } from "../../components/ui";
import NoAccess from "../../components/ui/NoAccess";
import { useAssociation } from "../../hooks";
import { csvDataMapper } from "../../utils";

const filterOptions: ZudFilterOptionType[] = [
  {
    type: "date_range",
    key: "date_range",
    startKey: "arrival_on__gte",
    endKey: "arrival_on__lte",
    fromLabel: "Start Date",
    toLabel: "End Date",
    label: "Stay Dates",
    hint: "Shows guests present at the property during these dates.",
  },
];

const DigitalRegister: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("front-desk-manager");
  const router = useRouter();

  const [data, setData] = useState<GeneralObject[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);

  const breadCrumbs = [
    {
      text: "Digital Register",
      to: "/digital-register",
    },
  ];

  const {
    data: selectedCheckin,
    refetch: refetchSelectedCheckin,
    isLoading: isLoadingSelectedCheckin,
    isRefetching: isRefetchingSelectedCheckin,
  } = useQueryApi<GeneralObject>(
    "ADMIN_PM_CHECKIN",
    {
      enabled: isValidString(router.query.slug?.[0]) && canView,
      select: (data) => data?.data,
    },
    `${router.query.slug?.[0]}/`
  );

  const hideSelectedCheckin = () => {
    router.push("/digital-register", undefined, { shallow: true });
  };

  const handleRowClick = (row: GeneralObject) => {
    router.push(`/digital-register/${row.id}`, undefined, { shallow: true });
  };

  const refetchAndUpdateCheckin = () => {
    setTimeout(async () => {
      const { data: newSelectedCheckin } = await refetchSelectedCheckin();
      setData((prev) =>
        prev.map((b) =>
          b.id === selectedCheckin?.id ? { ...newSelectedCheckin } : b
        )
      );
      setSearchResults((prev) =>
        prev.map((b) =>
          b.id === selectedCheckin?.id ? { ...newSelectedCheckin } : b
        )
      );
    }, 500);
  };

  const {
    isLoading: isSearching,
    isFetching: isFetchingSearch,
    remove: removeSearchResults,
  } = useQueryApi<GeneralObject[]>(
    "ADMIN_PM_CHECKIN_SEARCH",
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
    `operator=${selectedOperator?.id}&&q=${searchQuery}${
      dateRange
        ? `&arrival_on__gte=${dateRange.from}&arrival_on__lte=${dateRange.to}`
        : `&arrival_on_before=${moment().add(1, "day").format("YYYY-MM-DD")}`
    }&ordering=-arrival_on&null_bookings=0`
  );

  const customSearchQuery = `operator=${selectedOperator?.id}&ordering=-arrival_on&null_bookings=0`;

  const { isLoading, reset, count } = useInfiniteTable({
    setter: setData,
    enabled: isValidObject(selectedOperator) && canView,
    queryEndpoint: "ADMIN_PM_CHECKIN",
    filterOptions: filterOptions,
    customSearchQuery: customSearchQuery,
    name: "register",
  });

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      removeSearchResults();
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (isValidObject(selectedOperator)) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperator]);

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Guest Name",
        dataIndex: "first_name",
        key: "first_name",
        render: (_, data) => `${data?.profile.first_name} 
                    ${data?.profile.last_name || ""}`,
      },
      {
        title: "Phone Number",
        dataIndex: "phone_number",
        key: "phone_number",
        render: (_, data) => {
          let phone = data?.profile.mobile || "";
          // Remove all spaces
          phone = phone.replace(/\s+/g, "");
          // Add + if not present
          if (phone && phone[0] !== "+") {
            phone = "+" + phone;
          }
          try {
            return parsePhoneNumber(phone).formatInternational();
          } catch (e) {
            Sentry.captureException(e);
            return phone;
          }
        },
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render: (_, data) => data?.profile.email,
      },
      {
        title: "Booking Code",
        dataIndex: "booking_code",
        key: "booking_code",
        render: (_, data) => data?.booking?.code || "N/A",
      },
      {
        title: "Check-in → Check-out",
        dataIndex: "checkins",
        key: "checkins",
        render: (_, data) => (
          <div className="w-36 flex items-center gap-2">
            <span>{moment(data?.arrival_on).format("DD MMM")}</span>
            <span>→</span>
            <span>{moment(data?.departure_on).format("DD MMM")}</span>
          </div>
        ),
      },
    ],
    []
  );

  const onDateChange = (event: DateRange | null | [Dayjs, Dayjs]): void => {
    if (Array.isArray(event)) {
      // Handle Dayjs array case
      const [from, to] = event;
      setDateRange({
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
      });
    } else if (event?.from && event?.to) {
      // Handle DateRange case
      setDateRange({
        from: dayjs(event.from).format("YYYY-MM-DD"),
        to: dayjs(event.to).format("YYYY-MM-DD"),
      });
    } else {
      setDateRange(null);
    }
  };

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page breadCrumbs={breadCrumbs}>
      <PageHeader title="Digital Register" />
      <PageContent>
        <div className="flex justify-between space-x-6 mb-6">
          <Statistic label="Total Arrivals" value={count} />
          {dateRange && !searchQuery && (
            <div className="hidden md:block">
              <DownloadBulkPDF
                fileName={`Register-${dateRange.from}-${dateRange.to}`}
                queryEndpoint="ADMIN_PM_CHECKIN"
                search={`operator=${selectedOperator.id}&ordering=-arrival_on&null_bookings=0&limit=${count}&arrival_on__gte=${dateRange.from}&arrival_on__lte=${dateRange.to}`}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 border-t border-zui-light pt-6">
          {filterOptions && (
            <ZudFilterOptions
              name="register"
              options={filterOptions}
              className="mb-0"
              onDateChange={onDateChange}
            />
          )}
          <div className="flex space-x-4">
            <CollapsibleSearch
              disableCollapse
              value={searchQuery}
              isExpanded
              onChange={setSearchQuery}
            />
          </div>
        </div>
        {dateRange && !searchQuery && (
          <div className="block md:hidden mb-6 -mt-2">
            <DownloadCSV
              fileName={`Register-${dateRange.from}-${dateRange.to}`}
              queryEndpoint="ADMIN_PM_CHECKIN"
              search={`operator=${selectedOperator.id}&ordering=-arrival_on&null_bookings=0&limit=${count}&arrival_on__gte=${dateRange.from}&arrival_on__lte=${dateRange.to}`}
              csvDataMapper={csvDataMapper}
            />
          </div>
        )}

        <ZudTable
          isLoading={isLoading || isSearching || isFetchingSearch}
          data={
            searchQuery.trim().length > 2 ? searchResults || [] : data || []
          }
          columns={columns}
          keyExtractor={(row) => row.id}
          onRowClick={handleRowClick}
        />
      </PageContent>
      <CheckinInfoSidebar
        isOpen={isValidString(router.query.slug?.[0])}
        isLoadingCheckin={isLoadingSelectedCheckin}
        isRefetchingCheckin={isRefetchingSelectedCheckin}
        checkin={selectedCheckin || {}}
        onClose={hideSelectedCheckin}
        refetchCheckin={refetchAndUpdateCheckin}
      />
    </Page>
  );
};

export default DigitalRegister;
