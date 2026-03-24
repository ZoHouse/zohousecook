import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Card, Col, Empty, Progress, Row, Segmented, Spin, Statistic, Tag } from "antd";
import { NextPage } from "next";
import React, { useEffect, useMemo, useState } from "react";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import useAssociation from "../../hooks/useAssociation";

const OPERATOR_TO_ESTATE: Record<string, string> = {
  BNGHO812: "01",
  BNGS531: "08",
};

interface Estate { id: string; name: string; code: string }
interface Floor { id: string; name: string; code: string; estate: Estate }
interface Space { id: string; name: string; code: string; category: string; floor: Floor }

interface Task {
  id: string;
  title: string;
  status: string;
  space: Space;
  assigned_to: { first_name: string; last_name: string } | null;
  finished_at: string | null;
  scheduled_start: string | null;
  updated_at: string;
  created_at: string;
}

interface Schedule {
  id: string;
  status: string;
  space: Space;
  template: { title: string; emoji?: string };
}

type SpaceStatus = "clean" | "in_progress" | "pending" | "idle";

interface SpaceCard {
  code: string;
  name: string;
  category: string;
  floorName: string;
  floorCode: string;
  status: SpaceStatus;
  assignee: string;
  todayCompleted: number;
  todayTotal: number;
  lastCompletedBy: string;
  lastCompletedAt: string | null;
  activeSchedules: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  room: "blue", dorm_room: "blue", workspace: "purple", kitchen: "orange",
  dining_area: "gold", bathroom: "cyan", gym: "red", outdoor: "green",
  entrance: "default", lobby: "default", living_room: "geekblue",
};

const STATUS_CONFIG: Record<SpaceStatus, { color: string; label: string; dot: string }> = {
  clean: { color: "#52c41a", label: "Clean", dot: "●" },
  in_progress: { color: "#faad14", label: "In Progress", dot: "◐" },
  pending: { color: "#ff4d4f", label: "Pending", dot: "○" },
  idle: { color: "rgba(255,255,255,0.25)", label: "No tasks today", dot: "—" },
};

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function getName(user: { first_name: string; last_name: string } | null) {
  if (!user) return "";
  return `${user.first_name} ${user.last_name}`.trim();
}

const HousekeepingStatus: NextPage = () => {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code as string | undefined;
  const estateCode = operatorCode ? OPERATOR_TO_ESTATE[operatorCode] : undefined;
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  // Fetch schedules
  const { data: schedulesData, isLoading: loadingSchedules } = useQueryApi<GeneralObject>(
    "CAS_HOUSEKEEPING_SCHEDULES",
    { enabled: !!estateCode, refetchOnWindowFocus: false, select: (d: GeneralObject) => d.data },
    "", "status=active&limit=-1"
  );

  // Fetch tasks — auto-refresh every 30s for live ops
  const { data: tasksData, isLoading: loadingTasks } = useQueryApi<GeneralObject>(
    "CAS_HOUSEKEEPING_TASKS",
    { enabled: !!estateCode, refetchInterval: 30000, select: (d: GeneralObject) => d.data },
    "", "limit=500&ordering=-updated_at"
  );

  const schedules: Schedule[] = schedulesData?.results || schedulesData || [];
  const tasks: Task[] = tasksData?.results || tasksData || [];

  // Filter tasks for this estate
  const estateTasks = useMemo(() =>
    tasks.filter(t => t.space?.floor?.estate?.code === estateCode),
    [tasks, estateCode]
  );

  // Today's summary stats
  const todayStats = useMemo(() => {
    const todayTasks = estateTasks.filter(t => isToday(t.created_at) || isToday(t.updated_at));
    const completed = todayTasks.filter(t => t.status === "completed").length;
    const inProgress = todayTasks.filter(t => t.status === "in_progress").length;
    const pending = todayTasks.filter(t => t.status === "active" || t.status === "pending").length;
    const total = completed + inProgress + pending;
    return { completed, inProgress, pending, total };
  }, [estateTasks]);

  // Build space cards
  const { floors, spacesByFloor } = useMemo(() => {
    if (!estateCode) return { floors: [] as { name: string; code: string }[], spacesByFloor: new Map<string, SpaceCard[]>() };

    const spaceMap = new Map<string, SpaceCard>();
    const floorMap = new Map<string, { name: string; code: string }>();

    const ensureSpace = (sp: Space) => {
      const key = sp.code;
      if (!spaceMap.has(key)) {
        spaceMap.set(key, {
          code: sp.code, name: sp.name, category: sp.category,
          floorName: sp.floor.name, floorCode: sp.floor.code,
          status: "idle", assignee: "", todayCompleted: 0, todayTotal: 0,
          lastCompletedBy: "", lastCompletedAt: null, activeSchedules: 0,
        });
      }
      floorMap.set(sp.floor.code, { name: sp.floor.name, code: sp.floor.code });
      return spaceMap.get(key)!;
    };

    // Count schedules per space
    for (const s of schedules) {
      if (!s.space?.floor?.estate || s.space.floor.estate.code !== estateCode) continue;
      ensureSpace(s.space).activeSchedules++;
    }

    // Process tasks
    for (const t of estateTasks) {
      if (!t.space?.floor) continue;
      const card = ensureSpace(t.space);
      const taskIsToday = isToday(t.created_at) || isToday(t.updated_at);

      if (taskIsToday) {
        if (t.status === "completed") {
          card.todayCompleted++;
          card.todayTotal++;
        } else if (t.status === "in_progress") {
          card.todayTotal++;
          card.status = "in_progress";
          card.assignee = getName(t.assigned_to);
        } else if (t.status === "active" || t.status === "pending") {
          card.todayTotal++;
          if (card.status !== "in_progress") card.status = "pending";
        }
      }

      // Track last completed (all time)
      if (t.status === "completed" && t.finished_at) {
        if (!card.lastCompletedAt || t.finished_at > card.lastCompletedAt) {
          card.lastCompletedAt = t.finished_at;
          card.lastCompletedBy = getName(t.assigned_to);
        }
      }
    }

    // Determine final status for each space
    for (const card of spaceMap.values()) {
      if (card.todayTotal > 0 && card.todayCompleted === card.todayTotal) {
        card.status = "clean";
      }
    }

    const sortedFloors = Array.from(floorMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    const grouped = new Map<string, SpaceCard[]>();
    for (const floor of sortedFloors) {
      grouped.set(floor.code,
        Array.from(spaceMap.values())
          .filter(s => s.floorCode === floor.code)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    return { floors: sortedFloors, spacesByFloor: grouped };
  }, [schedules, estateTasks, estateCode]);

  useEffect(() => {
    if (floors.length > 0 && (!activeFloor || !floors.find(f => f.code === activeFloor))) {
      setActiveFloor(floors[0].code);
    }
  }, [floors, activeFloor]);

  const currentSpaces = activeFloor ? spacesByFloor.get(activeFloor) || [] : [];
  const isLoading = loadingSchedules || loadingTasks;

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Housekeeping Status" icon="House" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : floors.length === 0 ? (
            <Empty description="No housekeeping data for this property" />
          ) : (
            <>
              {/* Today's summary */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Today's Progress"
                      value={todayStats.completed}
                      suffix={`/ ${todayStats.total}`}
                      valueStyle={{ color: todayStats.total > 0 && todayStats.completed === todayStats.total ? "#52c41a" : undefined }}
                    />
                    {todayStats.total > 0 && (
                      <Progress
                        percent={Math.round((todayStats.completed / todayStats.total) * 100)}
                        size="small"
                        showInfo={false}
                        strokeColor="#cfff50"
                        style={{ marginTop: 4 }}
                      />
                    )}
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic title="In Progress" value={todayStats.inProgress} valueStyle={{ color: "#faad14" }} />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic title="Pending" value={todayStats.pending} valueStyle={{ color: todayStats.pending > 0 ? "#ff4d4f" : undefined }} />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic title="Completed" value={todayStats.completed} valueStyle={{ color: "#52c41a" }} />
                  </Card>
                </Col>
              </Row>

              {/* Floor selector */}
              <div style={{ marginBottom: 24 }}>
                <Segmented
                  value={activeFloor || ""}
                  options={floors.map(f => ({ label: f.name, value: f.code }))}
                  onChange={(val) => setActiveFloor(val as string)}
                />
              </div>

              {/* Space cards */}
              {currentSpaces.length === 0 ? (
                <Empty description="No spaces on this floor" />
              ) : (
                <Row gutter={[16, 16]}>
                  {currentSpaces.map((space) => {
                    const sc = STATUS_CONFIG[space.status];
                    return (
                      <Col xs={24} sm={12} lg={8} xl={6} key={space.code}>
                        <Card
                          size="small"
                          title={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ color: sc.color, fontSize: 10 }}>{sc.dot}</span>
                              <span style={{ fontSize: 14, fontWeight: 600 }}>{space.name}</span>
                            </div>
                          }
                          extra={
                            <Tag color={CATEGORY_COLORS[space.category] || "default"} style={{ margin: 0 }}>
                              {space.category.replace(/_/g, " ")}
                            </Tag>
                          }
                          styles={{ body: { padding: "12px 16px" } }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* Live status */}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span style={{ color: "rgba(255,255,255,0.45)" }}>Status</span>
                              <Tag color={space.status === "clean" ? "success" : space.status === "in_progress" ? "warning" : space.status === "pending" ? "error" : "default"} style={{ margin: 0 }}>
                                {sc.label}
                              </Tag>
                            </div>

                            {/* Assignee if in progress */}
                            {space.status === "in_progress" && space.assignee && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                <span style={{ color: "rgba(255,255,255,0.45)" }}>Assigned to</span>
                                <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{space.assignee}</span>
                              </div>
                            )}

                            {/* Today's progress */}
                            {space.todayTotal > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                <span style={{ color: "rgba(255,255,255,0.45)" }}>Today</span>
                                <span style={{ fontWeight: 500 }}>
                                  {space.todayCompleted}/{space.todayTotal} done
                                </span>
                              </div>
                            )}

                            {/* Last cleaned */}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span style={{ color: "rgba(255,255,255,0.45)" }}>Last cleaned</span>
                              <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
                                {space.lastCompletedBy
                                  ? `${space.lastCompletedBy} · ${space.lastCompletedAt ? timeSince(space.lastCompletedAt) : ""}`
                                  : "—"}
                              </span>
                            </div>

                            {/* Schedule count */}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span style={{ color: "rgba(255,255,255,0.45)" }}>Schedules</span>
                              <span style={{ fontWeight: 500 }}>{space.activeSchedules}</span>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default HousekeepingStatus;
