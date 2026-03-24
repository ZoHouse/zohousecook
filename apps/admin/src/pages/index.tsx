import { useEffect, useState } from "react";
import { useAuth, useQueryApi } from "@zo/auth";
import { humanizeNumbers } from "@zo/utils/number";
import { DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { NextPage } from "next";
import { Page, PageContent } from "../components/ui2";
import moment from "moment";

interface DashboardMetric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

interface DestinationData {
  total: number;
  total_fields: number;
  status: {
    inactive: number;
    active: number;
  };
  fields: Array<{
    filled: number;
    count: number;
  }>;
}

const Dashboard: NextPage = () => {
  const { isLoggedIn } = useAuth();
  const [selectedTime, setSelectedTime] = useState("today");
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs(),
    dayjs(),
  ]);
  const [fromDate, setFromDate] = useState(
    moment().startOf("day").format("YYYY-MM-DD")
  );
  const [toDate, setToDate] = useState(
    moment().endOf("day").format("YYYY-MM-DD")
  );
  const [currentTime, setCurrentTime] = useState(
    moment().utcOffset("+05:30").format("HH:mm")
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().utcOffset("+05:30").format("HH:mm"));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const { data: destinationData } = useQueryApi<DestinationData>(
    "CAS_REPORTS_DESTINATIONS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null,
      select: (data) => data.data,
    },
    "",
    ""
  );

  const { data: OperatorsData } = useQueryApi<any>(
    "CAS_REPORTS_OPERATORS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null,
      select: (data) => data.data,
    },
    "",
    ""
  );

  const { data: allowListData } = useQueryApi<any>(
    "CAS_REPORTS_ALLOWLISTS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null,
      select: (data) => data.data,
    },
    "",
    ""
  );

  const { data: bulletinData, refetch } = useQueryApi<any>(
    "CAS_REPORTS_BULLETINS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}`
  );

  const { data: eventsData } = useQueryApi<any>(
    "CAS_REPORTS_INVENTORIES",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `type=2&from_date=${fromDate}&to_date=${toDate}&date_field=start_at`
  );

  const { data: messageData } = useQueryApi<any>(
    "CAS_REPORTS_MESSAGE",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}`
  );

  const { data: poaData } = useQueryApi<any>(
    "CAS_REPORTS_POA",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}&date_field=started_at`
  );

  const { data: showcaseData } = useQueryApi<any>(
    "CAS_REPORTS_SHOWCASES",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}`
  );

  const { data: visitorsData } = useQueryApi<any>(
    "CAS_REPORTS_VISITS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}&date_field=checkin_time`
  );

  const { data: bookingSummary } = useQueryApi<any>(
    "CRS_BOOKINGS_SUMMARY",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}`
  );

  const { data: usersData } = useQueryApi<any>(
    "CRS_REPORTS_USERS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null,
      select: (data) => data.data,
    },
    "",
    ""
  );

  const { data: ratingsData } = useQueryApi<any>(
    "CAS_REPORTS_RATINGS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}`
  );

  const { data: userReportData } = useQueryApi<any>(
    "CAS_REPORT_USERS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null,
      select: (data) => data.data,
    },
    "",
    ""
  );

  const humanizeAmount = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 10000000) {
      // 1 crore
      return `₹${(absAmount / 10000000).toFixed(2)}Cr`;
    } else if (absAmount >= 100000) {
      // 1 lakh
      return `₹${(absAmount / 100000).toFixed(2)}L`;
    } else {
      return `₹${absAmount.toLocaleString("en-IN")}`;
    }
  };

  const metrics: DashboardMetric[] = [
    {
      label: "Bookings",
      value: bookingSummary ? `${bookingSummary.totals.bookings.current}` : "0",
      change: bookingSummary
        ? `${bookingSummary.totals.bookings.delta > 0 ? "+" : ""}${
            bookingSummary.totals.bookings.delta
          }`
        : "0",
      isPositive: bookingSummary
        ? bookingSummary.totals.bookings.delta > 0
        : true,
    },
    {
      label: "GBV",
      value: bookingSummary
        ? humanizeAmount(bookingSummary.totals.gbv.current)
        : "₹0",
      change: bookingSummary
        ? (bookingSummary.totals.gbv.delta > 0 ? "+" : "-") +
          humanizeAmount(Math.abs(bookingSummary.totals.gbv.delta))
        : "₹0",
      isPositive: bookingSummary ? bookingSummary.totals.gbv.delta > 0 : true,
    },
    {
      label: "Destinations",
      value: destinationData ? `${destinationData.status.active}` : "0",
      change: destinationData
        ? `${destinationData.status.inactive} inactive`
        : "0 inactive",
    },
    {
      label: "Properties",
      value: OperatorsData ? `${OperatorsData.status.active}` : "0",
      change: OperatorsData ? `${OperatorsData.status.inactive} inactive` : "",
    },
    {
      label: "Citizens",
      value: userReportData
        ? `${humanizeNumbers(userReportData.total_verified)}`
        : "-",
      change: usersData
        ? `${humanizeNumbers(usersData.total)} shadow users`
        : "",
    },
    {
      label: "Allow List",
      value: allowListData
        ? `${allowListData.status.approved}/${allowListData.total}`
        : "0/0",
      change: allowListData
        ? `${allowListData.status.pending} pending • ${allowListData.status.rejected} rejected`
        : "0 pending • 0 rejected",
    },
    {
      label: "Bulletins",
      value: bulletinData
        ? `${bulletinData.status.published}/${bulletinData.total}`
        : "0/0",
      change: bulletinData
        ? `${bulletinData.status.pending} pending • ${bulletinData.status.unpublished} unpublished`
        : "0 pending • 0 unpublished",
    },
    {
      label: "Events",
      value: eventsData
        ? `${eventsData.status.active}/${eventsData.total}`
        : "0/0",
      change: eventsData
        ? `${eventsData.status.inactive} inactive `
        : "0 inactive",
    },
    {
      label: "Messages",
      value: messageData ? `${messageData.total}` : "0",
      change: messageData
        ? `${messageData.status.delivered} delivered • ${messageData.status.seen} seen`
        : "0 delivered • 0 seen",
    },
    {
      label: "POA",
      value: poaData ? `${poaData.status.active}/${poaData.total}` : "0/0",
      change: poaData
        ? `${poaData.status.inactive} inactive • ${
            poaData.status.expired || 0
          } expired`
        : "0 inactive • 0 expired",
    },
    {
      label: "ShowCase",
      value: showcaseData
        ? `${showcaseData.status.active}/${showcaseData.total}`
        : "0/0",
      change: showcaseData
        ? `${showcaseData.status.inactive} inactive`
        : "0 inactive",
    },
    {
      label: "Visitors",
      value: visitorsData
        ? `${visitorsData.status["checked-in"]}/${visitorsData.total}`
        : "0/0",
      change: visitorsData
        ? `${visitorsData.status["checked-out"]} checked-out • ${visitorsData.new_visitors_count} new`
        : "0 checked-out • 0 new",
    },
    {
      label: "Rating",
      value: `${(ratingsData?.average_rating || 0).toFixed(1)} (${
        ratingsData?.total || 0
      })`,
      change: `${(
        (ratingsData?.average_rating || 0) -
        (ratingsData?.prev_data?.average_rating || 0)
      ).toFixed(1)}`,
      isPositive:
        (ratingsData?.average_rating || 0) >
        (ratingsData?.prev_data?.average_rating || 0),
    },
  ];

  const timeOptions = [
    { value: "today", label: "Today" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "custom", label: "Custom Range" },
  ];

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
    setIsCustomRange(value === "custom");

    let newFromDate: Dayjs;
    let newToDate = dayjs().endOf("day");

    switch (value) {
      case "last_7_days":
        newFromDate = dayjs().subtract(7, "days").startOf("day");
        break;
      case "last_30_days":
        newFromDate = dayjs().subtract(30, "days").startOf("day");
        break;
      case "custom":
        return;
      default:
        newFromDate = dayjs().startOf("day");
        break;
    }

    setFromDate(newFromDate.format("YYYY-MM-DD"));
    setToDate(newToDate.format("YYYY-MM-DD"));
    setDateRange([newFromDate, newToDate]);
  };

  const handleCustomDateChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      setFromDate(dates[0].startOf("day").format("YYYY-MM-DD"));
      setToDate(dates[1].endOf("day").format("YYYY-MM-DD"));
    }
  };

  return (
    <Page>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Zo World</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedTime}
            onChange={handleTimeChange}
            options={timeOptions}
            placeholder="Select Time Period"
            className="w-48"
            size="large"
          />
          {isCustomRange && (
            <DatePicker.RangePicker
              size="large"
              value={dateRange}
              onChange={handleCustomDateChange}
              className="min-w-[300px]"
              allowClear={false}
            />
          )}
        </div>
      </div>

      <PageContent className="pt-6">
        <div className="grid grid-cols-5 gap-8">
          {metrics.map((metric, index) => renderMetricCard(metric, index))}
        </div>
      </PageContent>
    </Page>
  );
};

export default Dashboard;

const renderMetricCard = (metric: DashboardMetric, index: number) => {
  const { label, value, change, isPositive } = metric;

  const changeClass = isPositive ? "text-zui-neon" : "text-zui-red";

  const formattedValue = value.includes("/") ? (
    <>
      <span className="text-zui-neon">{value.split("/")[0]}</span>
      <span className="text-white">/{value.split("/")[1]}</span>
    </>
  ) : (
    <span className="text-zui-neon">{value}</span>
  );

  return (
    <div key={index} className={`space-y-2 `}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-semibold">{formattedValue}</div>
      <div className={`text-sm ${changeClass}`}>{change}</div>
    </div>
  );
};
