import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Empty, Spin, Table, Tabs, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import { NextPage } from "next";
import React, { useMemo } from "react";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import useAssociation from "../../hooks/useAssociation";

const OPERATOR_TO_ESTATE: Record<string, string> = {
  BNGHO812: "01",
  BNGS531: "08",
};

interface Estate {
  id: string;
  name: string;
  code: string;
}

interface Space {
  id: string;
  name: string;
  code: string;
  category: string;
  floor: { id: string; name: string; code: string; estate: Estate };
}

interface Schedule {
  id: string;
  status: string;
  weekdays: string[];
  timings: string[];
  special_instructions: string;
  template: { title: string; emoji?: string };
  space: Space;
}

interface AttendanceRecord {
  id: string;
  checkin_time: string;
  checkout_time: string | null;
  user: { first_name: string; last_name: string; nickname?: string } | null;
  estate: Estate;
}

const WEEKDAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// ─── Schedules Tab ──────────────────────────────────────────────────────────

const SchedulesTab: React.FC<{ estateCode: string }> = ({ estateCode }) => {
  const { data, isLoading } = useQueryApi<GeneralObject>(
    "CAS_HOUSEKEEPING_SCHEDULES",
    {
      refetchOnWindowFocus: false,
      select: (data: GeneralObject) => data.data,
    },
    "",
    "status=active&limit=-1"
  );

  const schedules: Schedule[] = useMemo(() => {
    const all: Schedule[] = data?.results || data || [];
    return all.filter(
      (s) => s.space?.floor?.estate?.code === estateCode
    );
  }, [data, estateCode]);

  const columns: ColumnsType<Schedule> = [
    {
      title: "Task",
      dataIndex: ["template", "title"],
      key: "template",
      render: (text, row) => (
        <span>
          {row.template?.emoji ? `${row.template.emoji} ` : ""}
          {text}
        </span>
      ),
    },
    {
      title: "Space",
      dataIndex: ["space", "name"],
      key: "space",
    },
    {
      title: "Floor",
      dataIndex: ["space", "floor", "name"],
      key: "floor",
    },
    {
      title: "Days",
      dataIndex: "weekdays",
      key: "weekdays",
      render: (days: string[]) =>
        days?.map((d) => WEEKDAY_SHORT[d] || d).join(", ") || "—",
    },
    {
      title: "Timings",
      dataIndex: "timings",
      key: "timings",
      render: (timings: string[]) =>
        timings?.length > 0 ? timings.join(", ") : "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status}
        </Tag>
      ),
    },
  ];

  if (isLoading) return <Spin />;
  if (schedules.length === 0)
    return <Empty description="No active schedules" />;

  return (
    <Table
      dataSource={schedules}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 20 }}
    />
  );
};

// ─── Attendance Tab ─────────────────────────────────────────────────────────

const AttendanceTab: React.FC<{ estateCode: string }> = ({ estateCode }) => {
  const { data, isLoading } = useQueryApi<GeneralObject>(
    "CAS_HOUSEKEEPING_ATTENDANCE",
    {
      refetchOnWindowFocus: false,
      select: (data: GeneralObject) => data.data,
    },
    "",
    "ordering=-checkin_time&limit=50"
  );

  const records: AttendanceRecord[] = useMemo(() => {
    const all: AttendanceRecord[] = data?.results || data || [];
    return all.filter((r) => r.estate?.code === estateCode);
  }, [data, estateCode]);

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: "Staff",
      key: "user",
      render: (_, row) => {
        if (!row.user) return "—";
        return (
          row.user.nickname ||
          `${row.user.first_name} ${row.user.last_name}`.trim()
        );
      },
    },
    {
      title: "Check-in",
      dataIndex: "checkin_time",
      key: "checkin_time",
      render: (val: string) =>
        val ? (
          <Tooltip title={moment(val).format("LLL")}>
            {moment(val).format("DD MMM, HH:mm")}
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: "Check-out",
      dataIndex: "checkout_time",
      key: "checkout_time",
      render: (val: string | null) =>
        val ? (
          <Tooltip title={moment(val).format("LLL")}>
            {moment(val).format("DD MMM, HH:mm")}
          </Tooltip>
        ) : (
          <Tag color="success">On shift</Tag>
        ),
    },
    {
      title: "Hours",
      key: "hours",
      render: (_, row) => {
        if (!row.checkin_time) return "—";
        const end = row.checkout_time
          ? new Date(row.checkout_time)
          : new Date();
        const hours =
          (end.getTime() - new Date(row.checkin_time).getTime()) / 3600000;
        return `${hours.toFixed(1)}h`;
      },
    },
  ];

  if (isLoading) return <Spin />;
  if (records.length === 0)
    return <Empty description="No attendance records" />;

  return (
    <Table
      dataSource={records}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 20 }}
    />
  );
};

// ─── Performance Tab ────────────────────────────────────────────────────────

const PerformanceTab: React.FC<{ estateCode: string }> = ({ estateCode }) => {
  const { data, isLoading } = useQueryApi<GeneralObject>(
    "CAS_HOUSEKEEPING_TASKS",
    {
      refetchOnWindowFocus: false,
      select: (data: GeneralObject) => data.data,
    },
    "",
    "limit=500&ordering=-updated_at"
  );

  const stats = useMemo(() => {
    const allTasks = (data?.results || data || []) as Array<{
      status: string;
      assigned_to: { first_name: string; last_name: string; id: string } | null;
      space: Space;
      finished_at: string | null;
      scheduled_finish: string | null;
    }>;
    const filtered = allTasks.filter(
      (t) => t.space?.floor?.estate?.code === estateCode
    );

    // Aggregate per staff member
    const staffMap = new Map<
      string,
      { name: string; completed: number; onTime: number; total: number }
    >();

    for (const t of filtered) {
      if (!t.assigned_to) continue;
      const key = t.assigned_to.id || `${t.assigned_to.first_name}-${t.assigned_to.last_name}`;
      if (!staffMap.has(key)) {
        staffMap.set(key, {
          name: `${t.assigned_to.first_name} ${t.assigned_to.last_name}`.trim(),
          completed: 0,
          onTime: 0,
          total: 0,
        });
      }
      const entry = staffMap.get(key)!;
      entry.total++;
      if (t.status === "completed") {
        entry.completed++;
        if (
          t.finished_at &&
          t.scheduled_finish &&
          t.finished_at <= t.scheduled_finish
        ) {
          entry.onTime++;
        }
      }
    }

    return Array.from(staffMap.values()).sort(
      (a, b) => b.completed - a.completed
    );
  }, [data, estateCode]);

  const columns: ColumnsType<(typeof stats)[0]> = [
    {
      title: "Staff",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span style={{ textTransform: "capitalize" }}>{name}</span>
      ),
    },
    {
      title: "Assigned",
      dataIndex: "total",
      key: "total",
      align: "right",
    },
    {
      title: "Completed",
      dataIndex: "completed",
      key: "completed",
      align: "right",
    },
    {
      title: "Completion %",
      key: "rate",
      align: "right",
      render: (_, row) => {
        if (row.total === 0) return "—";
        const pct = Math.round((row.completed / row.total) * 100);
        return (
          <Tag color={pct >= 80 ? "success" : pct >= 50 ? "warning" : "error"}>
            {pct}%
          </Tag>
        );
      },
    },
    {
      title: "On-time",
      key: "onTime",
      align: "right",
      render: (_, row) => {
        if (row.completed === 0) return "—";
        const pct = Math.round((row.onTime / row.completed) * 100);
        return `${pct}%`;
      },
    },
  ];

  if (isLoading) return <Spin />;
  if (stats.length === 0)
    return <Empty description="No task data for performance metrics" />;

  return (
    <Table
      dataSource={stats}
      columns={columns}
      rowKey="name"
      size="small"
      pagination={false}
    />
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────

const HouseOps: NextPage = () => {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code as string | undefined;
  const estateCode = operatorCode
    ? OPERATOR_TO_ESTATE[operatorCode]
    : undefined;

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="House Ops" icon="Doc" />
        <PageContent>
          {!estateCode ? (
            <Empty description="Select a Zo House property" />
          ) : (
            <Tabs
              defaultActiveKey="schedules"
              items={[
                {
                  key: "schedules",
                  label: "Schedules",
                  children: <SchedulesTab estateCode={estateCode} />,
                },
                {
                  key: "attendance",
                  label: "Attendance",
                  children: <AttendanceTab estateCode={estateCode} />,
                },
                {
                  key: "performance",
                  label: "Performance",
                  children: <PerformanceTab estateCode={estateCode} />,
                },
              ]}
            />
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default HouseOps;
