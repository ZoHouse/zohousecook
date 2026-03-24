import { EllipsisOutlined } from "@ant-design/icons";
import {
  AddOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import { useMutationApi, useQueriesApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import type { TableColumnsType } from "antd";
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Image,
  message,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import moment from "moment";
import { NextPage } from "next";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ActivityCell, {
  Activity,
  TimeSlotId,
} from "../../components/helpers/activity-manager/ActivityCell";
import ActivityEditSidebar from "../../components/helpers/activity-manager/ActivityEditSidebar";
import ActivitySchedulerSidebar from "../../components/helpers/activity-manager/ActivitySchedulerSidebar";
import ActivityViewSidebar from "../../components/helpers/activity-manager/ActivityViewSidebar";
import ScheduleViewSidebar from "../../components/helpers/activity-manager/ScheduleViewSidebar";
import SKUEditSidebar from "../../components/helpers/activity-manager/SKUEditSidebar";
import { Page, PageContent, PageHeader } from "../../components/ui";
import NoAccess from "../../components/ui/NoAccess";
import { useAssociation } from "../../hooks";

type ApiActivity = {
  id: string;
  name: string;
  skus: GeneralObject[];
  status?: string;
  category?: string;
  type?: string;
  description?: string;
  media?: GeneralObject[];
};

type Schedule = Record<TimeSlotId, Record<string, Activity[]>>;

const timeSlotRows: Array<{ key: TimeSlotId; label: string }> = [
  {
    key: "morning",
    label: "Morning Activity (starts between 5:00 AM and 11:00 AM)",
  },
  { key: "day", label: "Day Activity (starts between 11:00 AM and 5:00 PM)" },
  {
    key: "evening",
    label: "Evening Activity (starts between 5:00 PM and 8:00 PM)",
  },
  {
    key: "night",
    label: "Night Activity (starts between 8:00 PM and 11:00 PM)",
  },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // adjust when day is Sunday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const initialSchedule: Schedule = {
  morning: {},
  day: {},
  evening: {},
  night: {},
};

const DAY_COLUMN_WIDTH = 260;

type Status = "active" | "inactive" | "pending" | "schedules";

function cloneEmptySchedule(): Schedule {
  return JSON.parse(JSON.stringify(initialSchedule));
}

function getSlotByHour(hour: number): TimeSlotId {
  if (hour >= 5 && hour <= 10) return "morning";
  if (hour >= 11 && hour <= 16) return "day";
  if (hour >= 17 && hour <= 19) return "evening";
  return "night";
}

const ActivitiesPage: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("activity-manager");
  const [weekAnchor, setWeekAnchor] = useState<Date>(getMonday(new Date()));
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });
  const [mobileWeeks, setMobileWeeks] = useState<Date[]>(() => [
    getMonday(new Date()),
  ]);
  const [schedule, setSchedule] = useState<Schedule>(cloneEmptySchedule());
  const [isSKUModalOpen, setSKUModalOpen] = useState(false);
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [isMultiDayMode, setIsMultiDayMode] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status>("active");
  const [isWeekLoading, setIsWeekLoading] = useState<boolean>(false);
  const [isActivityScheduleModalOpen, setActivityScheduleModalOpen] =
    useState(false);
  // create/update inventory and sku mutations moved into SKUEditSidebar
  const { mutate: deleteActivity } = useMutationApi(
    "CAS_PM_INVENTORY",
    {},
    "",
    "DELETE"
  );

  const { mutate: deleteSKU } = useMutationApi("CAS_PM_SKU", {}, "", "DELETE");

  // Track initial auto-scroll to today's column on desktop view
  const hasAutoScrolledRef = useRef(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const lastNavigationRef = useRef<null | "prev" | "next">(null);

  const weekDates = useMemo(() => {
    const monday = getMonday(weekAnchor);
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [weekAnchor]);

  const weekQuery = useMemo(() => {
    const start = moment(weekDates[0]).subtract(1, "day").format("YYYY-MM-DD");
    const end = moment(weekDates[6]).add(1, "day").format("YYYY-MM-DD");
    if (!selectedOperator?.code) return "";
    return `limit=100&operator__pid=${selectedOperator.code}&type=activity&skus__date__gte=${start}&skus__date__lte=${end}`;
  }, [selectedOperator?.code, weekDates]);

  const isCurrentWeekShown = useMemo(() => {
    const today = moment().startOf("day");
    const first = moment(weekDates[0]).startOf("day");
    const last = moment(weekDates[6]).startOf("day");
    return today.isSameOrAfter(first) && today.isSameOrBefore(last);
  }, [weekDates]);

  const { data, refetch: refetchActivities } = useQueryApi(
    "CAS_PM_INVENTORY",
    { enabled: !!selectedOperator && !!weekQuery && canView },
    "",
    weekQuery
  );
  const { data: schedules, refetch: refetchSchedules } = useQueryApi(
    "CAS_INVENTORY_SCHEDULES",
    { enabled: !!selectedOperator && canView },
    `?inventory__operator__pid=${selectedOperator?.code}&limit=100`
  );

  const { data: allPendingActivities, refetch: refetchPendingActivities } =
    useQueryApi(
      "CAS_PM_INVENTORY",
      { enabled: !!selectedOperator && canView },
      "",
      `operator__pid=${selectedOperator?.code}&limit=-1&type=activity&status=pending`
    );

  const { data: allInactiveActivities, refetch: refetchInactiveActivities } =
    useQueryApi(
      "CAS_PM_INVENTORY",
      { enabled: !!selectedOperator && canView },
      "",
      `operator__pid=${selectedOperator?.code}&limit=-1&type=activity&status=inactive`
    );

  const { data: allActiveActivities, refetch: refetchActiveActivities } =
    useQueryApi(
      "CAS_PM_INVENTORY",
      { enabled: !!selectedOperator && canView },
      "",
      `operator__pid=${selectedOperator?.code}&limit=-1&type=activity&status=active`
    );

  // Derive schedule from API results whenever week or results change
  useEffect(() => {
    const next: Schedule = cloneEmptySchedule();
    const results: ApiActivity[] =
      (
        data as
          | {
              data?: {
                results?: ApiActivity[];
              };
            }
          | undefined
      )?.data?.results || [];
    results.forEach((item: ApiActivity) => {
      (item.skus || []).forEach((sku: GeneralObject) => {
        const dateKey: string | undefined = sku?.date;
        if (!dateKey) return;
        const startTime: string | undefined = sku?.start_time;
        const endTime: string | undefined = sku?.end_time;
        const hour = startTime ? Number(String(startTime).split(":")[0]) : 0;
        const slot = getSlotByHour(isNaN(hour) ? 0 : hour);
        if (!next[slot][dateKey]) next[slot][dateKey] = [];
        next[slot][dateKey].push({
          id: item.id,
          name: item.name,
          sku,
          // For sorting, synthesize ISO strings from date + time
          start_at:
            dateKey && startTime ? `${dateKey}T${startTime}` : undefined,
          end_at: dateKey && endTime ? `${dateKey}T${endTime}` : undefined,
        });
      });
    });
    setSchedule(next);
    setIsWeekLoading(false);
  }, [data, weekQuery, weekDates]);

  const [currentEditing, setCurrentEditing] = useState<{
    slot: TimeSlotId;
    date: Date;
    activity?: Activity | null;
    sku?: GeneralObject | null;
    callback?: () => void;
  } | null>(null);
  // form removed; now managed inside SKUEditSidebar

  const [viewActivityId, setViewActivityId] = useState<string | null>(null);
  const [viewScheduleId, setViewScheduleId] = useState<string | null>(null);

  const openAddModal = useCallback((slot: TimeSlotId, date: Date) => {
    setCurrentEditing({ slot, date, activity: null });
    setSKUModalOpen(true);
  }, []);

  const openEditModal = useCallback(
    (
      slot: TimeSlotId,
      date: Date,
      activity: Activity,
      sku?: GeneralObject,
      callback?: () => void
    ) => {
      setCurrentEditing({ slot, date, activity, sku, callback });
      setSKUModalOpen(true);
    },
    []
  );

  const removeSKU = useCallback(
    (id: string) => {
      deleteSKU(
        {
          data: {},
          route: `${id}/`,
        },
        {
          onSuccess: () => {
            refetchActivities();
          },
        }
      );
    },
    [deleteSKU, refetchActivities]
  );

  const renderCell = useCallback(
    (slot: TimeSlotId, date: Date) => {
      const dateKey = moment(date).format("YYYY-MM-DD");
      const activities: Activity[] = schedule[slot][dateKey] || [];
      const contentPadding = 8;
      const isPastDay = moment(date).isBefore(moment().startOf("day"));

      return (
        <div className="cell-wrapper">
          {activities.length === 0 ? (
            !isPastDay ? (
              <Button
                type="dashed"
                onClick={() => openAddModal(slot, date)}
                icon={<AddOutlined />}
                style={{ width: "100%" }}
              >
                Add Activity
              </Button>
            ) : (
              <div className="flex items-center justify-center text-zui-silver cursor-default">
                No Activity
              </div>
            )
          ) : (
            <>
              {activities
                .slice()
                .sort(
                  (a, b) =>
                    moment(a.start_at).valueOf() - moment(b.start_at).valueOf()
                )
                .map((activity) => {
                  return (
                    <ActivityCell
                      key={activity.id}
                      activity={activity}
                      slot={slot}
                      date={date}
                      openEditModal={openEditModal}
                      removeSKU={removeSKU}
                    />
                  );
                })}
              {!isPastDay ? (
                <Button
                  type="dashed"
                  onClick={() => openAddModal(slot, date)}
                  icon={<AddOutlined />}
                  style={{ width: "100%" }}
                >
                  Add Activity
                </Button>
              ) : null}
            </>
          )}
          <style jsx>{`
            .cell-wrapper {
              padding: ${contentPadding}px;
            }
            :global(.activity-card) {
              position: relative;
              border-radius: 0;
              transition: transform 0.12s ease, box-shadow 0.12s ease;
            }
            :global(.activity-card:hover) {
              transform: translateY(-1px);
            }
            .card-more {
              position: absolute;
              top: 6px;
              right: 6px;
              z-index: 1;
            }
          `}</style>
        </div>
      );
    },
    [schedule, openAddModal, openEditModal, removeSKU]
  );

  type RowData = { key: TimeSlotId; label: string };

  const tableColumns: TableColumnsType<RowData> = useMemo(() => {
    const firstCol: TableColumnsType<RowData>[number] = {
      title: <div style={{ fontWeight: 600 }}>Activity Slot</div>,
      dataIndex: "label",
      key: "label",
      width: 220,
      fixed: "left" as const,
      render: (text: string) => {
        const match = text.match(/^(.*?)\s*\((.*)\)\s*$/);
        const title = match ? match[1] : text;
        const subtitle = match ? match[2] : "";
        return (
          <div style={{ whiteSpace: "normal", lineHeight: 1.2 }}>
            <Typography.Text strong>{title}</Typography.Text>
            {subtitle ? (
              <div>
                <Typography.Text type="secondary">{subtitle}</Typography.Text>
              </div>
            ) : null}
          </div>
        );
      },
    };

    const dayCols: TableColumnsType<RowData> = weekDates.map((date, idx) => ({
      title: (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700 }}>
            {new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)}
          </div>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
            {formatLongDate(date)}
          </div>
        </div>
      ),
      dataIndex: moment(date).format("YYYY-MM-DD"),
      key: moment(date).format("YYYY-MM-DD"),
      width: 260,
      onHeaderCell: () => {
        const classes: string[] = [];
        if (moment(date).isSame(moment(), "day")) classes.push("is-today");
        if (idx === 0) classes.push("is-first-day");
        return { className: classes.join(" ") || undefined };
      },
      onCell: () => {
        const classes: string[] = [];
        if (moment(date).isSame(moment(), "day")) classes.push("is-today");
        if (idx === 0) classes.push("is-first-day");
        return { className: classes.join(" ") || undefined };
      },
      render: (_: unknown, record: RowData) => renderCell(record.key, date),
    }));

    return [firstCol, ...dayCols];
  }, [weekDates, renderCell]);

  const dataSource = useMemo(
    () =>
      timeSlotRows.map((row) => ({
        key: row.key,
        label: row.label,
      })),
    []
  );

  const previousWeek = () =>
    setWeekAnchor((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() - 7);
      lastNavigationRef.current = "prev";
      setIsWeekLoading(true);
      return next;
    });

  const nextWeek = () =>
    setWeekAnchor((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + 7);
      lastNavigationRef.current = "next";
      setIsWeekLoading(true);
      return next;
    });

  // Track viewport resize for mobile/desktop toggle
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const scrollToToday = useCallback(() => {
    if (isMobile) return;
    const container = tableContainerRef.current;
    if (!container) return;
    // Prefer a body cell so the whole table scrolls horizontally
    const bodyToday = container.querySelector(
      ".ant-table-tbody td.is-today"
    ) as HTMLElement | null;
    if (bodyToday && bodyToday.scrollIntoView) {
      bodyToday.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
      hasAutoScrolledRef.current = true;
      return;
    }
    // Fallback to header cell if body cell not present (empty table)
    const headerToday = container.querySelector(
      ".ant-table-thead th.is-today"
    ) as HTMLElement | null;
    if (headerToday && headerToday.scrollIntoView) {
      headerToday.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "start",
      });
      hasAutoScrolledRef.current = true;
    }
  }, [isMobile]);

  const scrollToFirstDay = useCallback(() => {
    if (isMobile) return;
    const container = tableContainerRef.current;
    if (!container) return;
    // Move the scroll containers to the extreme left to account for the fixed first column
    const body = container.querySelector(
      ".ant-table-body"
    ) as HTMLElement | null;
    const header = container.querySelector(
      ".ant-table-header"
    ) as HTMLElement | null;
    if (body) {
      body.scrollTo({ left: 0, behavior: "smooth" });
    }
    if (header) {
      header.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [isMobile]);

  const scrollTodayToLeft = useCallback(() => {
    if (isMobile) return;
    const container = tableContainerRef.current;
    if (!container) return;
    const index = weekDates.findIndex((d) => moment(d).isSame(moment(), "day"));
    if (index < 0) return;

    const body = container.querySelector(
      ".ant-table-body"
    ) as HTMLElement | null;
    const header = container.querySelector(
      ".ant-table-header"
    ) as HTMLElement | null;
    const left = index * DAY_COLUMN_WIDTH;
    if (body) {
      body.scrollTo({ left, behavior: "smooth" });
    }
    if (header) {
      header.scrollTo({ left, behavior: "smooth" });
    }
  }, [isMobile, weekDates]);

  const backToCurrentWeek = useCallback(() => {
    const currentMonday = getMonday(new Date());
    lastNavigationRef.current = "next";
    setIsWeekLoading(true);
    setWeekAnchor(currentMonday);
  }, []);

  // One-time auto-scroll to today's day if current week on initial load (desktop only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasAutoScrolledRef.current) return;
    if (!data) return; // wait for initial response so table header exists

    const today = moment().startOf("day");
    const first = moment(weekDates[0]).startOf("day");
    const last = moment(weekDates[6]).startOf("day");
    const isCurrentWeek =
      today.isSameOrAfter(first) && today.isSameOrBefore(last);
    if (!isCurrentWeek) return;

    const timeoutId = window.setTimeout(() => {
      scrollToToday();
    }, 500);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [weekDates, data, scrollToToday]);

  // After navigating weeks, scroll to first day column
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!lastNavigationRef.current) return;

    const timeoutId = window.setTimeout(() => {
      const today = moment().startOf("day");
      const first = moment(weekDates[0]).startOf("day");
      const last = moment(weekDates[6]).startOf("day");
      const isCurrentWeek =
        today.isSameOrAfter(first) && today.isSameOrBefore(last);
      if (isCurrentWeek) {
        scrollTodayToLeft();
      } else {
        scrollToFirstDay();
      }
      lastNavigationRef.current = null;
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [weekDates, scrollToFirstDay, scrollTodayToLeft]);

  // Build queries for mobile multi-week list
  const mobileWeekDates = useMemo(() => {
    return mobileWeeks.map((start) =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      })
    );
  }, [mobileWeeks]);

  const mobileQueries = useMemo(() => {
    return mobileWeekDates.map((dates) => {
      const start = moment(dates[0]).subtract(1, "day").format("YYYY-MM-DD");
      const end = moment(dates[6]).add(1, "day").format("YYYY-MM-DD");
      if (!selectedOperator?.code) return ["", ""] as [string, string];
      const search = `limit=100&operator__pid=${selectedOperator.code}&type=activity&skus__date__gte=${start}&skus__date__lte=${end}`;
      return ["", search] as [string, string];
    });
  }, [mobileWeekDates, selectedOperator?.code]);

  const mobileResults = useQueriesApi(
    "CAS_PM_INVENTORY",
    { enabled: !!selectedOperator && canView },
    mobileQueries as [string, string][]
  );

  // diff utilities now owned by SKUEditSidebar

  const mobileSchedules: Schedule[] = useMemo(() => {
    return mobileResults.map((res, idx) => {
      const next: Schedule = cloneEmptySchedule();
      const results: ApiActivity[] =
        (res as unknown as { data?: { data?: { results?: ApiActivity[] } } })
          ?.data?.data?.results || [];
      results.forEach((item: ApiActivity) => {
        (item.skus || []).forEach((sku: GeneralObject) => {
          const dateKey: string | undefined = sku?.date;
          if (!dateKey) return;
          const startTime: string | undefined = sku?.start_time;
          const endTime: string | undefined = sku?.end_time;
          const hour = startTime ? Number(String(startTime).split(":")[0]) : 0;
          const slot = getSlotByHour(isNaN(hour) ? 0 : hour);
          if (!next[slot][dateKey]) next[slot][dateKey] = [];
          next[slot][dateKey].push({
            id: item.id,
            name: item.name,
            sku,
            start_at:
              dateKey && startTime ? `${dateKey}T${startTime}` : undefined,
            end_at: dateKey && endTime ? `${dateKey}T${endTime}` : undefined,
          } as Activity);
        });
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileResults, mobileWeekDates]);

  // refetchForDate no longer used; kept intentionally removed in favor of broad refetch

  function appendPreviousWeekMobile() {
    const first = mobileWeeks[0];
    const prev = new Date(first);
    prev.setDate(first.getDate() - 7);
    setMobileWeeks([prev, ...mobileWeeks]);
  }

  function appendNextWeekMobile() {
    const last = mobileWeeks[mobileWeeks.length - 1];
    const next = new Date(last);
    next.setDate(last.getDate() + 7);
    setMobileWeeks([...mobileWeeks, next]);
  }

  // compute available height for the table to nearly fill viewport
  const approxHeaderHeight = 56; // PageHeader
  const weekLabelHeight = 28; // week range label
  const verticalMargins = 40; // padding/margins within PageContent
  const availableY = Math.max(
    300,
    typeof window !== "undefined"
      ? window.innerHeight -
          (approxHeaderHeight + weekLabelHeight + verticalMargins)
      : 520
  );

  const renderActivities = useCallback(
    (status: Status) => {
      // Handle schedules separately
      if (status === "schedules") {
        const schedulesList = schedules?.data?.results;
        if (!schedulesList?.length) {
          return (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No schedules"
            />
          );
        }
        return (
          <Row gutter={[16, 16]}>
            {schedulesList?.map((schedule: GeneralObject) => {
              const inventory = schedule.inventory;
              const firstImage = inventory?.media?.[0];
              const frequencyLabels: Record<string, string> = {
                WEEKLY: "Weekly",
                MONTHLY: "Monthly",
                YEARLY: "Yearly",
              };
              const recurrenceText =
                schedule.frequency === "WEEKLY" && schedule.weekdays
                  ? `${schedule.weekdays.length} day(s)`
                  : schedule.frequency === "MONTHLY" && schedule.monthdays
                  ? `${schedule.monthdays.length} date(s)`
                  : schedule.frequency === "YEARLY" && schedule.months
                  ? `${schedule.months.length} month(s)`
                  : "—";
              return (
                <Col key={schedule.id} xs={24} sm={12} md={8} xxl={6}>
                  <Card
                    hoverable
                    onClick={() => setViewScheduleId(schedule.id)}
                    style={{ position: "relative", overflow: "hidden" }}
                    cover={
                      firstImage ? (
                        <div
                          style={{
                            width: "100%",
                            height: 160,
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <Image
                            src={firstImage.url}
                            alt={inventory?.name || "Activity"}
                            width="100%"
                            height={160}
                            style={{
                              objectFit: "cover",
                              backgroundColor: "#222",
                            }}
                            preview={false}
                          />
                          <Tag
                            color="cyan"
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              fontSize: 12,
                            }}
                          >
                            Schedule
                          </Tag>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 160,
                            backgroundColor: "#222",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Tag color="cyan" style={{ fontSize: 12 }}>
                            Schedule
                          </Tag>
                        </div>
                      )
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <Typography.Text strong ellipsis>
                        {schedule.name}
                      </Typography.Text>
                      <Space size={4} wrap>
                        <Tag color="blue">
                          {frequencyLabels[schedule.frequency] ||
                            schedule.frequency}
                        </Tag>
                        <Tag color="green">{recurrenceText}</Tag>
                      </Space>
                      {inventory && (
                        <Typography.Paragraph
                          type="secondary"
                          ellipsis={{ rows: 2 }}
                          style={{ marginTop: 4, marginBottom: 0 }}
                        >
                          Activity: {inventory.name}
                        </Typography.Paragraph>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        );
      }

      // Handle regular activities
      const activities =
        status === "active"
          ? allActiveActivities?.data
          : status === "pending"
          ? allPendingActivities?.data
          : allInactiveActivities?.data;

      if (!activities?.length) {
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No activities"
          />
        );
      }
      return (
        <Row gutter={[16, 16]}>
          {activities?.map((a: GeneralObject) => (
            <Col key={a.id} xs={24} sm={12} md={8} xxl={6}>
              <Card
                hoverable
                style={{ position: "relative", overflow: "hidden" }}
                cover={
                  <div
                    style={{
                      width: "100%",
                      height: 160,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={a.media?.[0]?.url}
                      alt={a.name}
                      width="100%"
                      height={160}
                      style={{ objectFit: "cover", backgroundColor: "#222" }}
                      preview={{ mask: "Preview" }}
                    />
                  </div>
                }
              >
                <div
                  style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
                >
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        a.status === "pending"
                          ? { key: "cancel", label: "Cancel activity" }
                          : {
                              key: "disabled",
                              label: "Only pending can be cancelled",
                              disabled: true,
                            },
                      ],
                      onClick: ({ key }) => {
                        if (key !== "cancel") return;
                        Modal.confirm({
                          title: "Cancel this activity?",
                          content: "This action cannot be undone.",
                          okText: "Cancel Activity",
                          okButtonProps: { danger: true },
                          onOk: () =>
                            new Promise((resolve, reject) =>
                              deleteActivity(
                                { data: {}, route: `${a.id}/` },
                                {
                                  onSuccess: () => {
                                    // Refresh only the affected list
                                    if (a.status === "pending")
                                      refetchPendingActivities();
                                    if (a.status === "active")
                                      refetchActiveActivities();
                                    if (a.status === "inactive")
                                      refetchInactiveActivities();
                                    resolve(null);
                                  },
                                  onError: () => {
                                    message.error("Failed to cancel activity");
                                    reject();
                                  },
                                }
                              )
                            ),
                        });
                      },
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      icon={<EllipsisOutlined />}
                    />
                  </Dropdown>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Typography.Text strong>{a.name}</Typography.Text>
                  <Tag
                    color={
                      a.status === "active"
                        ? "success"
                        : a.status === "pending"
                        ? "warning"
                        : "default"
                    }
                  >
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </Tag>
                </div>
                {a.description && (
                  <Typography.Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ marginTop: 8, marginBottom: 0 }}
                  >
                    {a.description}
                  </Typography.Paragraph>
                )}
                {a.media?.length > 1 && (
                  <div style={{ marginTop: 10 }}>
                    <Space size={6} wrap>
                      {a.media?.slice(1, 5).map((m: GeneralObject) => (
                        <Image
                          key={m.id}
                          src={m.url}
                          alt={`${a.name} media ${m.id}`}
                          width={56}
                          height={40}
                          style={{ objectFit: "cover" }}
                          preview={{ mask: "Preview" }}
                        />
                      ))}
                    </Space>
                  </div>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setViewActivityId(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setViewActivityId(a.id);
                  }}
                  style={{ position: "absolute", inset: 0 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      );
    },
    [
      allActiveActivities?.data,
      allInactiveActivities?.data,
      allPendingActivities?.data,
      deleteActivity,
      refetchActiveActivities,
      refetchInactiveActivities,
      refetchPendingActivities,
      schedules?.data?.results,
    ]
  );

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page>
      <PageHeader title="Activity Manager" />
      <PageContent>
        {!isMobile ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium">Activity Calendar</h2>
                <h3 className="text-sm font-medium text-zui-silver">
                  {formatLongDate(weekDates[0])} —{" "}
                  {formatLongDate(weekDates[6])}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!isCurrentWeekShown ? (
                  <Button
                    type="default"
                    onClick={backToCurrentWeek}
                    icon={<RefreshOutlined />}
                  >
                    Back to Today
                  </Button>
                ) : null}
                <Button
                  type="default"
                  onClick={previousWeek}
                  icon={<ArrowLeftOutlined />}
                >
                  Previous Week
                </Button>
                <Button
                  type="default"
                  onClick={nextWeek}
                  icon={<ArrowRightOutlined />}
                >
                  Next Week
                </Button>
              </div>
            </div>
            <div
              className="table-container"
              ref={tableContainerRef}
              style={{
                position: "relative",
                opacity: isWeekLoading ? 0.5 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              <Table
                columns={tableColumns}
                dataSource={dataSource}
                pagination={false}
                bordered
                sticky
                scroll={{ x: 1400, y: availableY }}
                size="middle"
              />
              {isWeekLoading ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Spin size="large" />
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="mobile-week-controls mb-3">
              <Button
                onClick={appendPreviousWeekMobile}
                type="default"
                style={{ width: "100%" }}
              >
                Previous Week
              </Button>
            </div>
            <div className="mobile-list">
              {mobileWeekDates.map((dates, wIdx) => (
                <div key={`week-${wIdx}`} className="week-block">
                  {dates.map((date, dIdx) => (
                    <div key={`day-${wIdx}-${dIdx}`} className="day-block">
                      <div className="day-header px-2 py-1">
                        <div className="font-bold">
                          {new Intl.DateTimeFormat("en-US", {
                            weekday: "long",
                          }).format(date)}
                        </div>
                        <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                          {formatLongDate(date)}
                        </div>
                      </div>
                      <div className="slots">
                        {timeSlotRows.map((row) => {
                          const dateKey = moment(date).format("YYYY-MM-DD");
                          const activities: Activity[] =
                            (mobileSchedules[wIdx] || ({} as Schedule))[
                              row.key
                            ]?.[dateKey] || [];
                          const slotBox = (children: React.ReactNode) => (
                            <div
                              className="mobile-slot-box"
                              style={{
                                padding: 12,
                                border: "1px solid #2a2a2a",
                                borderRadius: 10,
                              }}
                            >
                              {children}
                            </div>
                          );
                          if (activities.length === 0) {
                            return (
                              <div
                                key={`${row.key}-${dIdx}`}
                                style={{ padding: 8 }}
                              >
                                {slotBox(
                                  <Space
                                    direction="vertical"
                                    size={6}
                                    style={{ width: "100%" }}
                                  >
                                    {(() => {
                                      const match = row.label.match(
                                        /^(.*?)\s*\((.*)\)\s*$/
                                      );
                                      const title = match
                                        ? match[1]
                                        : row.label;
                                      const subtitle = match ? match[2] : "";
                                      return (
                                        <div style={{ lineHeight: 1.2 }}>
                                          <Typography.Text
                                            strong
                                            style={{ color: "#fff" }}
                                          >
                                            {title}
                                          </Typography.Text>
                                          {subtitle ? (
                                            <div>
                                              <Typography.Text type="secondary">
                                                ({subtitle})
                                              </Typography.Text>
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })()}
                                    <Typography.Text type="secondary">
                                      No activity
                                    </Typography.Text>
                                    {!moment(date).isBefore(
                                      moment().startOf("day")
                                    ) ? (
                                      <Button
                                        type="dashed"
                                        icon={<AddOutlined />}
                                        onClick={() =>
                                          openAddModal(row.key, date)
                                        }
                                        style={{ width: "100%" }}
                                      >
                                        Add Activity
                                      </Button>
                                    ) : null}
                                  </Space>
                                )}
                              </div>
                            );
                          }
                          return (
                            <div
                              key={`${row.key}-${dIdx}`}
                              style={{ padding: 8 }}
                            >
                              {slotBox(
                                <Space
                                  direction="vertical"
                                  size={8}
                                  style={{ width: "100%" }}
                                >
                                  {(() => {
                                    const match = row.label.match(
                                      /^(.*?)\s*\((.*)\)\s*$/
                                    );
                                    const title = match ? match[1] : row.label;
                                    const subtitle = match ? match[2] : "";
                                    return (
                                      <div style={{ lineHeight: 1.2 }}>
                                        <Typography.Text
                                          strong
                                          style={{ color: "#fff" }}
                                        >
                                          {title}
                                        </Typography.Text>
                                        {subtitle ? (
                                          <div>
                                            <Typography.Text type="secondary">
                                              ({subtitle})
                                            </Typography.Text>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })()}
                                  {activities
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        moment(a.start_at).valueOf() -
                                        moment(b.start_at).valueOf()
                                    )
                                    .map((activity) => {
                                      return (
                                        <ActivityCell
                                          slot={row.key as TimeSlotId}
                                          date={date}
                                          key={activity.id}
                                          activity={activity}
                                          openEditModal={openEditModal}
                                          removeSKU={removeSKU}
                                        />
                                      );
                                    })}
                                  {!moment(date).isBefore(
                                    moment().startOf("day")
                                  ) ? (
                                    <Button
                                      type="dashed"
                                      onClick={() =>
                                        openAddModal(row.key, date)
                                      }
                                      icon={<AddOutlined />}
                                      style={{ width: "100%" }}
                                    >
                                      Add Activity
                                    </Button>
                                  ) : null}
                                </Space>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mobile-week-controls" style={{ marginTop: 12 }}>
              <Button
                onClick={appendNextWeekMobile}
                type="default"
                style={{ width: "100%" }}
              >
                Next Week
              </Button>
            </div>
          </>
        )}

        <div className="mb-4 mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">All Activities</h2>
            <h3 className="text-sm font-medium text-zui-silver">
              Manage all activities here
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="default"
              onClick={setActivityScheduleModalOpen.bind(null, true)}
              icon={<AddOutlined />}
            >
              Schedule a New Activity
            </Button>
            <Button
              type="default"
              onClick={setActivityModalOpen.bind(null, true)}
              icon={<AddOutlined />}
            >
              Submit a New Activity
            </Button>
          </div>
        </div>
        <div>
          <Segmented
            options={[
              {
                label: `Active (${allActiveActivities?.data?.length})`,
                value: "active",
              },
              {
                label: `Schedules (${schedules?.data?.count})`,
                value: "schedules",
              },
              {
                label: `Pending (${allPendingActivities?.data?.length})`,
                value: "pending",
              },
              {
                label: `Inactive (${allInactiveActivities?.data?.length})`,
                value: "inactive",
              },
            ]}
            value={selectedStatus}
            onChange={(v) => setSelectedStatus(v as Status)}
          />
          <div style={{ marginTop: 16 }}>
            {renderActivities(selectedStatus)}
          </div>
        </div>

        <ActivityEditSidebar
          isModalOpen={isActivityModalOpen}
          onClose={setActivityModalOpen.bind(null, false)}
          onSuccess={refetchPendingActivities}
          selectedOperator={selectedOperator}
        />
        <ActivityViewSidebar
          isOpen={!!viewActivityId}
          onClose={() => setViewActivityId(null)}
          id={viewActivityId}
          selectedOperator={selectedOperator}
          onUpdated={() => {
            refetchActiveActivities();
            refetchInactiveActivities();
            refetchPendingActivities();
          }}
        />
        <SKUEditSidebar
          isModalOpen={isSKUModalOpen}
          onClose={() => {
            setSKUModalOpen(false);
            setIsMultiDayMode(false);
          }}
          onSuccess={refetchActivities}
          selectedOperator={selectedOperator}
          currentEditing={currentEditing}
          isMultiDayMode={isMultiDayMode}
        />
        <ActivitySchedulerSidebar
          isModalOpen={isActivityScheduleModalOpen}
          onClose={() => setActivityScheduleModalOpen(false)}
          onSuccess={() => {
            refetchSchedules();
            setTimeout(refetchActivities, 1000);
          }}
          selectedOperator={selectedOperator}
        />
        <ScheduleViewSidebar
          isOpen={!!viewScheduleId}
          onClose={() => setViewScheduleId(null)}
          scheduleId={viewScheduleId}
          onDeleted={() => {
            refetchSchedules();
            refetchActivities();
            setViewScheduleId(null);
          }}
          onViewActivity={(activityId) => {
            setViewScheduleId(null);
            setViewActivityId(activityId);
          }}
        />
      </PageContent>
    </Page>
  );
};

export default ActivitiesPage;
