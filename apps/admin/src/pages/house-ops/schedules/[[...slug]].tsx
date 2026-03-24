import { GeneralObject } from "@zo/definitions/general";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidUUID,
} from "@zo/utils/string";
import { Zud, ZudColumnType } from "@zo/zud";
import { Tag, Tooltip } from "antd";
import { ScheduleSidebar } from "apps/admin/src/components/sidebars";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

const Index: NextPage = () => {
  const router = useRouter();

  const params = useMemo(() => {
    const isNewEvent = router.query.slug == "new";

    if (
      router.query.slug &&
      Array.isArray(router.query.slug) &&
      router.query.slug.length > 0
    ) {
      const [scheduleId, mode] = router.query.slug;
      return {
        scheduleId: isValidUUID(scheduleId) ? scheduleId : null,
        isCreatingNewSchedule: isNewEvent,
        mode: mode,
      };
    }
    return {
      scheduleId: null,
      isCreatingNewSchedule: false,
      mode: null,
    };
  }, [router.query]);

  const columns: ZudColumnType[] = [
    {
      key: "template",
      title: "Template Title",
      dataIndex: "template",
      render: (cell) => cell.title || "No Template",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (cell) => {
        return (
          <Tag
            bordered={false}
            color={
              String(cell).toLowerCase() === "active" ? "success" : "warning"
            }
          >
            {formatCapitalize(String(cell))}
          </Tag>
        );
      },
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (cell) => (
        <Tooltip title={moment(cell).format("LLL")}>
          <span>{moment(cell).format("DD/MM/YYYY")}</span>
        </Tooltip>
      ),
    },
  ];

  const handleSidebarClose = () => {
    router.push(
      combineRouteAndQueryParams("/house-ops/schedules", router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleAddClick = () => {
    router.push(
      combineRouteAndQueryParams(`/house-ops/schedules/new`, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleRowClick = (data: GeneralObject) => {
    router.push(
      combineRouteAndQueryParams(
        `/house-ops/schedules/${data.id}/edit`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      <Zud
        name="schedule"
        title="Schedules"
        addButtonLabel="Add Schedule"
        queryEndpoint="CAS_HOUSEKEEPING_SCHEDULES"
        mutationEndpoint="CAS_HOUSEKEEPING_SCHEDULES"
        columns={columns}
        onAddClick={handleAddClick}
        onRowClick={handleRowClick}
        breadCrumbs={[
          { label: "House Ops", href: "/house-ops" },
          { label: "Schedules", href: "/house-ops/schedules" },
        ]}
      />
      <ScheduleSidebar
        isOpen={
          params.isCreatingNewSchedule ||
          (isValidUUID(params.scheduleId) && params.mode == "edit")
        }
        onClose={handleSidebarClose}
        scheduleId={params.scheduleId}
      />
    </>
  );
};

export default Index;
