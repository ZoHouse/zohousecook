import {
  Badge,
  Check,
  Close,
  Info,
  Numbers,
  Person,
  Wallet,
} from "@mui/icons-material";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { UserMini } from "@zo/moal";
import { formatAddress } from "@zo/utils/web3";
import {
  FormFieldType,
  Zud,
  ZudColumnType,
  ZudDetailsMiniDataType,
} from "@zo/zud";
import { Avatar, Flex, Tag } from "antd";
import { User } from "apps/admin/src/config";
import { NextPage } from "next";
import { useMemo } from "react";

const AllowList: NextPage = () => {
  const { mutate: updateList } = useMutationApi(
    "CAS_FOUNDER_ALLOWLISTS",
    {},
    "",
    "PUT"
  );

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected",
    onSuccess?: () => void
  ) => {
    updateList(
      {
        data: { status: status },
        route: `${id}/`,
      },
      {
        onSuccess,
      }
    );
  };

  const getAllowlistTagStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "processing";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const detailsMini: ZudDetailsMiniDataType = useMemo(
    () => ({
      userKey: "user",
      extra: (data?: GeneralObject, refetch?: () => void) => ({
        actionButtons:
          data?.status === "pending"
            ? [
                {
                  label: "Approve",
                  icon: <Check />,
                  type: "text",
                  onClick: () =>
                    handleUpdateStatus(data.id, "approved", refetch),
                },
                {
                  label: "Reject",
                  type: "text",
                  icon: <Close />,
                  danger: true,
                  onClick: () =>
                    handleUpdateStatus(data.id, "rejected", refetch),
                },
              ]
            : data?.status === "approved"
            ? [
                {
                  label: "Cancel",
                  icon: <Close />,
                  onClick: () =>
                    handleUpdateStatus(data.id, "rejected", refetch),
                },
              ]
            : [],
      }),
      dataList: [
        {
          id: "allowlist-info",
          dataKey: "allowlist-info",
          data: [
            {
              id: "id",
              dataKey: "id",
              label: "ID",
              icon: <Numbers />,
              copyText: (item: any) => item,
            },
            {
              id: "status",
              dataKey: "status",
              icon: <Info />,
              label: "Status",
              content: (item: any) => (
                <Tag bordered={false} color={getAllowlistTagStatus(item)}>
                  {item.toUpperCase()}
                </Tag>
              ),
            },
            {
              id: "wallet_address",
              dataKey: "wallet_address",
              label: "Referred Address",
              icon: <Wallet />,
              content: (item: any) => formatAddress(item),
              copyText(item: any) {
                return item;
              },
            },
            {
              id: "referred",
              dataKey: "referred",
              icon: <Badge />,
              label: "Referred By",
              isHidden: (item) => !item?.referred,
              link: (item) =>
                `${process.env.WEB_BASE_URL}/admin/users/${item?.pid}`,
              content: (item: any) =>
                item?.nickname ||
                item?.email_address ||
                item?.twitter_handle ||
                "Zo User",
            },
          ],
        },
      ],
    }),
    []
  );

  const columns: ZudColumnType[] = [
    {
      key: "wallet_address",
      title: "Referred Wallet Address",
      dataIndex: "wallet_address",
      render: (value: string) => (
        <a
          onClick={(e) => e.stopPropagation()}
          className="hover:underline hover:text-zui-neon text-white"
          href={`https://etherscan.io/address/${value}`}
          target="_blank"
        >
          {formatAddress(value)}
        </a>
      ),
    },
    {
      key: "user",
      title: "Referrer",
      dataIndex: "user",
      render: (value: User) => <UserMini data={value} />,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        return (
          <Tag bordered={false} color={getAllowlistTagStatus(status || "")}>
            {status === "pending"
              ? `PAYMENT ${status?.toUpperCase()}`
              : status?.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  const formFields: FormFieldType[] = [
    {
      label: "Referrer",
      name: "user",
      required: true,
      type: "searchselect",
      searchQueryApi: "CAS_PROFILES",
      responseFields: [
        "id",
        "user",
        "nickname",
        "selected_nickname",
        "pfp",
        "pid",
        "first_name",
        "last_name",
        "email_address",
        "wallet_address",
        "avatar",
      ],
      optionValueAndLabelSelector: (data) => ({
        value: data.user.id,
        label: (
          <Flex align="center" gap="small">
            <Avatar
              icon={<Person fontSize="small" />}
              size={24}
              src={data.avatar?.image}
            >
              {data.nickname || data.first_name}
            </Avatar>
            {data.nickname || data.first_name}
          </Flex>
        ),
      }),
    },
    {
      label: "Status",
      name: "status",
      type: "radio",
      options: [
        {
          label: "Pending",
          value: "pending",
        },
        {
          label: "Approved",
          value: "approved",
        },
      ],
      required: true,
    },
    {
      label: "Referred Wallet Address",
      name: "wallet_address",
      type: "text",
      required: true,
    },
  ];

  return (
    <Zud
      name="allowlist"
      title="Founder Allowlist"
      queryEndpoint="CAS_FOUNDER_ALLOWLISTS"
      mutationEndpoint="CAS_FOUNDER_ALLOWLISTS"
      columns={columns}
      formFields={formFields}
      detailsMini={detailsMini}
    />
  );
};

export default AllowList;
