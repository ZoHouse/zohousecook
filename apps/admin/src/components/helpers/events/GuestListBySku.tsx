import { Twitter } from "@mui/icons-material";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { formatCapitalize } from "@zo/utils/string";
import { Avatar, Space, Table, Tag, Typography } from "antd";
import React, { useState } from "react";

interface GuestListBySkuProps {
  skuPid: string;
  onRowClick: (data: any) => void;
}

const GuestListBySku: React.FC<GuestListBySkuProps> = ({
  skuPid,
  onRowClick,
}) => {
  const [data, setData] = useState<GeneralObject[]>([]);
  const { isLoading } = useInfiniteTable({
    setter: setData,
    queryEndpoint: "CAS_SKU",
    additionalRoute: `${skuPid}/bookings/`,
    name: "",
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Name",
      key: "user",
      render: (record: any) => (
        <Space>
          <Avatar size="small" src={record.user?.avatar?.image} />
          <Typography.Text>
            {record.user?.first_name} {record.user?.last_name}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Twitter",
      key: "twitter",
      render: (record: any) =>
        record.user?.twitter_handle ? (
          <a
            href={`https://twitter.com/${record.user.twitter_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-600"
          >
            <Twitter fontSize="small" />
            <span>@{record.user.twitter_handle}</span>
          </a>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: "Zo Membership",
      key: "membership",
      render: (record: any) => (
        <Typography.Text>
          {formatCapitalize(String(record.user?.membership))}
        </Typography.Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (record: any) => (
        <Tag bordered={false} color={getStatusColor(String(record.status))}>
          {formatCapitalize(String(record.status))}
        </Tag>
      ),
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      size="small"
      loading={isLoading}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: "pointer" },
      })}
      pagination={false}
      rowKey={(record) => record.id}
    />
  );
};

export default GuestListBySku;
