import { useQueryApi } from "@zo/auth";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { Application } from "../../config";
import { GeneralObject } from "@zo/definitions/general";
import { Tooltip } from "antd";

const Roles: NextPage = () => {
  const router = useRouter();

  const { data: applicationOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_APPLICATIONS", {
    refetchOnWindowFocus: false,
    select: (data) =>
      data.data.results.map((app: Application) => ({
        label: app.name,
        value: app.id,
      })),
  });

  const viewUsers = (data: GeneralObject) => {
    if (data.id) {
      router.push(`/user-roles/users/${data.id}/`, undefined, {
        shallow: true,
      });
    }
  };

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Title",
      dataIndex: "name",
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
    {
      key: "updated_at",
      title: "Last Updated on",
      dataIndex: "updated_at",
      render: (cell) => (
        <Tooltip title={moment(cell).format("LLL")}>
          <span>{moment(cell).format("DD/MM/YYYY")}</span>
        </Tooltip>
      ),
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      label: "Role",
      type: "text",
      required: true,
    },
    {
      name: "app",
      label: "Application",
      type: "select",
      required: true,
      options: applicationOptions,
    },
  ];

  return (
    <>
      <Zud
        name="user-roles"
        formFields={formFields}
        title="User Roles"
        queryEndpoint="CAS_ACCESSGROUP"
        mutationEndpoint="CAS_ACCESSGROUPS"
        onRowClick={viewUsers}
        columns={columns}
        breadCrumbs={[{ href: "/user-roles", label: "User Role" }]}
        allowEdit={false}
      />
    </>
  );
};

export default Roles;
