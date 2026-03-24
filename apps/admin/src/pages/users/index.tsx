import { useQueryApi } from "@zo/auth";
import { useMemo } from "react";

import { Person } from "@mui/icons-material";

import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { Zud, ZudColumnType, ZudFilterOptionType } from "@zo/zud";
import { Avatar, Flex, Tag, Tooltip } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";

const Users: NextPage = () => {
  const router = useRouter();

  const { data: profileCount } = useQueryApi<number>("CAS_USERS", {
    select: (data) => data.data.count,
    refetchOnWindowFocus: false,
  });

  const orderingOptions = useMemo(() => {
    return [
      { label: "Latest", value: "-created_at" },
      { label: "Oldest", value: "created_at" },
      { label: "Highest Rating", value: "-rating" },
      { label: "Lowest Rating", value: "rating" },
    ];
  }, []);

  const columns: ZudColumnType[] = [
    {
      key: "user",
      title: "Name",
      dataIndex: "profile",
      width: 240,
      render: (cell, row) => (
        <Flex align="center" gap={8}>
          <Avatar icon={<Person />} src={cell?.avatar.image} />

          <span
            className={cn(
              "text-zui-silver",
              row.profile?.nickname && "text-zui-white"
            )}
          >
            {row.profile?.nickname || row.profile?.full_name || "Zo User"}
          </span>
        </Flex>
      ),
    },
    {
      key: "gender",
      title: "Gender",
      dataIndex: ["profile", "gender"],
      render: (cell) =>
        cell ? (
          <Tag
            bordered={false}
            color={cell.toLowerCase() === "male" ? "blue" : "pink"}
          >
            {cell}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      key: "country",
      title: "Country",
      dataIndex: ["profile", "country", "name"],
      render: (cell) => cell || "-",
    },
    {
      key: "created_at",
      title: "Joined at",
      dataIndex: "created_at",
      render: (cell, row) => (
        <Tooltip
          title={moment(row?.created_at).format("MMMM Do YYYY, h:mm:ss a")}
        >
          {moment(row?.created_at).calendar()}
        </Tooltip>
      ),
    },
  ];

  const stats: { label: string; value: number }[] = [
    { label: "Total Users", value: profileCount || 0 },
  ];

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "ordering",
        key: "ordering",
        placeholder: "Sort By",
        className: "w-fit md:w-48",
        defaultSortKey: "-created_at",
        options: orderingOptions,
      },
      {
        type: "date_range",
        key: "date_range",
        startKey: "created_at__gte",
        endKey: "created_at__lte",
        fromLabel: "Created From",
        toLabel: "Created To",
      },
    ],
    [orderingOptions]
  );

  const handleRowClick = (row: GeneralObject) => {
    router.push(`/users/${row.id}`);
  };

  return (
    <>
      <Zud
        name="user"
        title="Users"
        queryEndpoint="CAS_USERS"
        mutationEndpoint="CAS_USERS"
        onRowClick={handleRowClick}
        columns={columns}
        stats={stats}
        searchable
        filterOptions={filterOptions}
      />
    </>
  );
};

export default Users;
