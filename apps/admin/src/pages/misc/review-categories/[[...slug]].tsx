import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import moment from "moment";
import { NextPage } from "next";
import { useMemo } from "react";

const ReviewCategories: NextPage = () => {
  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: (cell) =>
          cell && cell?.length > 100
            ? cell?.slice(0, 100) + "..."
            : cell || "N/A",
        width: "240px",
      },
      {
        title: "Sort Index",
        dataIndex: "sort_index",
        key: "sort_index",
      },
      {
        title: "Updated At",
        dataIndex: "updated_at",
        key: "updated_at",
        render(cell) {
          return (
            <span title={moment(cell).format("LLL")}>
              {moment(cell).startOf("day").fromNow()}
            </span>
          );
        },
      },
      {
        title: "Created At",
        dataIndex: "created_at",
        key: "created_at",
        render(cell) {
          return (
            <span title={moment(cell).format("LLL")}>
              {moment(cell).startOf("day").fromNow()}
            </span>
          );
        },
      },
    ],
    []
  );

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/review-categories", label: "Review Categories" },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      name: "sort_index",
      label: "Sort Index",
      type: "number",
    },
  ];

  return (
    <Zud
      formFields={formFields}
      name="review-categories"
      title="Review Category"
      columns={columns}
      breadCrumbs={breadcrumbs}
      queryEndpoint="CAS_REVIEW_CATEGORIES"
      mutationEndpoint="CAS_REVIEW_CATEGORIES"
      customSearchQuery="ordering=name"
    />
  );
};

export default ReviewCategories;
