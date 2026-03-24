import { PersonOutline } from "@mui/icons-material";
import { useQueryApi } from "@zo/auth";
import {
  FormFieldType,
  Zud,
  ZudColumnType,
  ZudFilterOptionType,
} from "@zo/zud";
import { Avatar, Flex, Typography } from "antd";
import { Estate } from "apps/admin/src/config";
import moment from "moment";
import { NextPage } from "next";
import { useMemo } from "react";

const Index: NextPage = () => {
  const { data: estateOptions } = useQueryApi<
    Array<{ value: string; label: string }>
  >(
    "CAS_ESTATES",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((estate: Estate) => ({
          label: estate.name,
          value: estate.id,
        })),
    },
    "",
    "limit=-1"
  );

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "user",
        title: "User",
        dataIndex: "user",
        render: (cell) =>
          cell ? (
            <Flex align="center" gap="small">
              <Avatar
                icon={<PersonOutline fontSize="small" />}
                src={cell?.avatar?.image}
              />
              <Flex vertical>
                <Typography.Text>
                  {cell?.nickname ||
                    cell?.name ||
                    cell?.email_address ||
                    cell?.mobile_number ||
                    "Zo User"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {cell?.membership || ""}
                </Typography.Text>
              </Flex>
            </Flex>
          ) : (
            <span>N/A</span>
          ),
      },
      {
        key: "estate",
        title: "Estate",
        dataIndex: "estate",
        render: (cell) => cell.name || "-",
      },
      {
        key: "checkin_time",
        title: "Check In",
        dataIndex: "checkin_time",
        render: (cell) =>
          cell ? (
            <span className="whitespace-nowrap">
              {moment(cell).format("LLL")}
            </span>
          ) : (
            "-"
          ),
      },
      {
        key: "checkout_time",
        title: "Check Out",
        dataIndex: "checkout_time",
        render: (cell) =>
          cell ? (
            <span className="whitespace-nowrap">
              {moment(cell).format("LLL")}
            </span>
          ) : (
            "-"
          ),
      },
    ],
    []
  );

  const formFields: FormFieldType[] = [
    {
      name: "user",
      label: "User",
      type: "searchselect",
      searchQueryApi: "CAS_PROFILES",
      required: true,
      optionValueAndLabelSelector(data) {
        return {
          value: data.user.id,
          label: data.nickname || data.name || "Zo User",
        };
      },
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
      disableOnEdit: true,
    },
    {
      name: "estate",
      type: "select",
      label: "Estate",
      required: true,
      options: estateOptions,
      disableOnEdit: true,
    },
    {
      name: "checkin_time",
      type: "datetime",
      label: "Check-In",
      required: true,
      initialValue: new Date(),
    },
    {
      name: "checkout_time",
      type: "datetime",
      label: "Check-Out",
    },
  ];

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "estate",
        className: "w-36",
        placeholder: "Estate",
        options: [
          {
            label: "All Estates",
            value: "null",
          },
          ...(estateOptions || []),
        ],
      },
    ],
    [estateOptions]
  );

  return (
    <Zud
      name="attendance"
      title="Attendance"
      queryEndpoint="CAS_HOUSEKEEPING_ATTENDANCE"
      mutationEndpoint="CAS_HOUSEKEEPING_ATTENDANCE"
      columns={columns}
      formFields={formFields}
      filterOptions={filterOptions}
      breadCrumbs={[
        { label: "House Ops", href: "/house-ops" },
        { label: "Attendance", href: "/house-ops/attendance" },
      ]}
    />
  );
};

export default Index;
