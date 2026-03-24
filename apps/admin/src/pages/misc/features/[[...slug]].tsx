import { useQueryApi } from "@zo/auth";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import moment from "moment";
import { NextPage } from "next";
import { renderMaterialIcon } from "../../../utils";

const Features: NextPage = () => {
  const columns: ZudColumnType[] = [
    {
      key: "icon",
      title: "Icon",
      dataIndex: "icon",
      render: (value: string) => renderMaterialIcon(value),
    },
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (date: string) => (
        <span title={moment(date).format("LLL")}>
          {moment(date).startOf("day").fromNow()}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      width: 300,
    },
  ];

  const { data: iconOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CRS_ICON",
    {
      enabled: true,
      select: (data) =>
        data?.data?.names.map((item: string) => ({
          value: item,
          label: item,
        })),
    },
    ""
  );

  const formFields: FormFieldType[] = [
    {
      label: "name",
      name: "name",
      type: "text",
      required: true,
    },
    {
      label: "icon",
      name: "icon",
      type: "select",
      required: true,
      options: iconOptions,
    },
    {
      label: "description",
      name: "description",
      type: "textarea",
      required: true,
    },
  ];

  return (
    <Zud
      name="features"
      title="Features"
      queryEndpoint="CAS_FEATURES"
      mutationEndpoint="CAS_FEATURES"
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Features;
