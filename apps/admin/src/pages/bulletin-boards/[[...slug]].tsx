import { PersonOutline } from "@mui/icons-material";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { combineRouteAndQueryParams, formatCapitalize } from "@zo/utils/string";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { Avatar, Flex, Tag, Tooltip } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";

const bulletinVisibility = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const BulletinBoards: NextPage = () => {
  const router = useRouter();

  const { data: statuses } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_SEED",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.bulletin_board.status.map((s: string) => ({
          value: s,
          label: formatCapitalize(s),
        })),
    },
    ""
  );

  const columns: ZudColumnType[] = [
    {
      key: "title",
      title: "Title",
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
      key: "visibility",
      title: "Visibility",
      dataIndex: "visibility",
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
    {
      key: "created_by",
      title: "Created By",
      dataIndex: "created_by",
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
  ];

  const handleDisplayBulletins = (data: GeneralObject) => {
    if (data.id) {
      router.push(
        combineRouteAndQueryParams(
          `/bulletin-boards/bulletins/${data.id}/`,
          router.query
        ),
        undefined,
        { shallow: true }
      );
    }
  };

  const formFields: FormFieldType[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: statuses,
      required: true,
    },
    {
      name: "visibility",
      label: "Visibility",
      type: "radio",
      options: bulletinVisibility,
      required: true,
    },
  ];

  return (
    <Zud
      name="bulletin-boards"
      title="Bulletin Boards"
      queryEndpoint="CAS_BULLETIN_BOARDS"
      mutationEndpoint="CAS_BULLETIN_BOARDS"
      columns={columns}
      onRowClick={handleDisplayBulletins}
      breadCrumbs={[{ href: "/bulletin-boards", label: "Bulletin Boards" }]}
      formFields={formFields}
      customSearchQuery="ordering=-updated_at"
      allowEdit={false}
    />
  );
};

export default BulletinBoards;
