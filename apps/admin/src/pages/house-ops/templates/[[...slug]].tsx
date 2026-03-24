import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { formatCapitalize } from "@zo/utils/string";
import { StatusCell } from "apps/admin/src/components/ui";
import moment from "moment";
import React, { useMemo } from "react";
import { Tag, Tooltip } from "antd";
import { NextPage } from "next";

const Index: NextPage = () => {
  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: true,
    select: (data) => data.data,
  });

  const templateCategoryOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed?.["task-templates"].category?.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const templatePriorityOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed?.["task-templates"].priority?.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const templateVisibilityOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed?.["task-templates"].visibility?.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const columns: ZudColumnType[] = [
    {
      key: "title",
      title: "Titlte",
      dataIndex: "title",
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
      key: "priority",
      title: "Priority",
      dataIndex: "priority",
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (cell) => (
        <Tooltip title={moment(cell).format("LLL")}>
          <span>{moment(cell).format("DD/MM/YYYY")}</span>
        </Tooltip>
      ),
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "emoji",
      type: "emojiPicker",
      label: "Emoji",
    },
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      required: true,
      options: templateCategoryOptions,
    },
    {
      name: "status",
      type: "radio",
      label: "Status",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "priority",
      type: "select",
      label: "Priority",
      required: true,
      options: templatePriorityOptions,
    },
    {
      name: "visibility",
      type: "radio",
      label: "Visibility",
      required: true,
      options: templateVisibilityOptions,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      required: true,
    },
    {
      name: "photo_required",
      type: "checkbox",
      label: "Photo Required",
    },
    {
      name: "video_required",
      type: "checkbox",
      label: "Video Required",
    },
    {
      name: "notes_required",
      type: "checkbox",
      label: "Notes Required",
    },
  ];

  return (
    <Zud
      name="templates"
      title="Templates"
      queryEndpoint="CAS_HOUSEKEEPING_TEMPLATES"
      mutationEndpoint="CAS_HOUSEKEEPING_TEMPLATES"
      columns={columns}
      formFields={formFields}
      breadCrumbs={[
        { href: "/house-ops", label: "House Ops" },
        { href: "/house-ops/templates", label: "Templates" },
      ]}
    />
  );
};

export default Index;
