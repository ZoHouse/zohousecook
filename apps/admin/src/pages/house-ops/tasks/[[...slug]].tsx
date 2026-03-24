import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidUUID,
} from "@zo/utils/string";
import { Zud, ZudColumnType, ZudFilterOptionType } from "@zo/zud";
import { HousekeepingTasksSidebar } from "apps/admin/src/components/sidebars";

import { PersonOutline } from "@mui/icons-material";
import { Avatar, Flex, Tag, Tooltip } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

const Index: NextPage = () => {
  const router = useRouter();

  const params = useMemo(() => {
    const isCreatingNewTask = router.query.slug == "new";

    if (
      router.query.slug &&
      Array.isArray(router.query.slug) &&
      router.query.slug.length > 0
    ) {
      const [taskId, mode] = router.query.slug;
      return {
        taskId: isValidUUID(taskId) ? taskId : null,
        isCreatingNewTask,
        mode: mode,
      };
    }
    return {
      taskId: null,
      isCreatingNewTask: false,
      mode: null,
    };
  }, [router.query]);

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const categoryFilterOptions = useMemo(() => {
    if (seed) {
      return seed.tasks.category.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const statusFilterOptions = useMemo(() => {
    if (seed) {
      return seed.tasks.status.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const priorityFilterOptions = useMemo(() => {
    if (seed) {
      return seed.tasks.priority.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const columns: ZudColumnType[] = [
    {
      key: "title",
      title: "Title",
      dataIndex: "title",
      width: 240,
      render: (cell, row) => (
        <span>
          {row && row.space ? `${cell} in ${row.space.name}` : `${cell}`}
        </span>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      dataIndex: "priority",
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
      key: "category",
      title: "Category",
      dataIndex: "category",
    },
    {
      key: "requested_by",
      title: "Requested By",
      dataIndex: "requested_by",
      render: (cell) =>
        cell ? (
          <Flex align="center" gap="small">
            <Avatar
              icon={<PersonOutline fontSize="small" />}
              src={cell?.pfp_image}
            />
            <span>{cell?.nickname || cell?.name || ""}</span>
          </Flex>
        ) : (
          <span>N/A</span>
        ),
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

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "status",
        className: "w-36",
        placeholder: "Status",
        options: [
          {
            label: "All Types",
            value: "null",
          },
          ...(statusFilterOptions || []),
        ],
      },
      {
        type: "select",
        key: "category",
        className: "w-36",
        placeholder: "Category",
        options: [
          {
            label: "All Category",
            value: "null",
          },
          ...(categoryFilterOptions || []),
        ],
      },
      {
        type: "select",
        key: "priority",
        className: "w-36",
        placeholder: "Priority",
        options: [
          {
            label: "All Priority",
            value: "null",
          },
          ...(priorityFilterOptions || []),
        ],
      },
    ],
    [categoryFilterOptions, statusFilterOptions, priorityFilterOptions]
  );

  const handleSidebarClose = () => {
    router.push(
      combineRouteAndQueryParams("/house-ops/tasks", router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleAddClick = () => {
    router.push(
      combineRouteAndQueryParams(`/house-ops/tasks/new`, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleRowClick = (data: GeneralObject) => {
    router.push(
      combineRouteAndQueryParams(
        `/house-ops/tasks/${data.id}/edit`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      <Zud
        name="tasks"
        title="Tasks"
        queryEndpoint="CAS_HOUSEKEEPING_TASKS"
        mutationEndpoint="CAS_HOUSEKEEPING_TASKS_FROM_TEMPLATE"
        columns={columns}
        onRowClick={handleRowClick}
        onAddClick={handleAddClick}
        customSearchQuery="ordering=-created_at"
        filterOptions={filterOptions}
        breadCrumbs={[
          { href: "/house-ops", label: "House Ops" },
          { href: "/house-ops/tasks", label: "Tasks" },
        ]}
      />
      <HousekeepingTasksSidebar
        isOpen={
          params.isCreatingNewTask ||
          (isValidUUID(params.taskId) && params.mode == "edit")
        }
        onClose={handleSidebarClose}
        taskId={params.taskId}
      />
    </>
  );
};

export default Index;
