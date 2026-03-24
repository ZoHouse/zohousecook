import { EditOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { Button, Empty, Skeleton, Table, Typography } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React from "react";

const { Title } = Typography;

interface CancellationPolicyProps {
  operatorId: string;
  refetch: () => void;
}

const CancellationPolicy: React.FC<CancellationPolicyProps> = ({
  operatorId,
  refetch,
}) => {
  const router = useRouter();

  const { data: policies, isLoading } = useQueryApi<GeneralObject[]>(
    "CAS_CANCELLATION_POLICY",
    {
      enabled: isValidString(operatorId),
      select(data) {
        return data.data.results;
      },
      refetchOnWindowFocus: false,
    },
    "",
    `operator=${operatorId}`
  );

  const columns = [
    {
      title: "Inventory",
      dataIndex: "inventory",
      key: "inventory",
      width: 120,
      render: (inventory: any) =>
        isValidString(inventory?.name) ? inventory.name : "-",
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 80,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
    },
    {
      title: "Start",
      dataIndex: "start_at",
      key: "start_at",
      width: 100,
      render: (date: string) => (
        <span title={moment(date).format("LLL")}>
          {moment(date).startOf("day").fromNow()}
        </span>
      ),
    },
    {
      title: "End",
      dataIndex: "end_at",
      key: "end_at",
      width: 100,
      render: (date: string) => (
        <span title={moment(date).format("LLL")}>
          {moment(date).startOf("day").fromNow()}
        </span>
      ),
    },
    {
      title: "Min Hours",
      dataIndex: "min_hours_till_start",
      key: "min_hours_till_start",
      width: 120,
    },
    {
      title: "Max Hours",
      dataIndex: "max_hours_till_start",
      key: "max_hours_till_start",
      width: 120,
    },
    {
      title: "Refund %",
      dataIndex: "refund_percent",
      key: "refund_percent",
      width: 100,
      render: (percent: number) => `${percent}%`,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date: string) => (
        <span title={moment(date).format("LLL")}>
          {moment(date).startOf("day").fromNow()}
        </span>
      ),
    },
  ];

  const gotoCancellationPolicyPage = () => {
    router.push(`/misc/cancellation-policy`, undefined, { shallow: true });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pt-6 pb-1">
          <Skeleton.Input
            style={{ width: 200 }}
            active
            size="large"
            className="mb-4"
          />
          <Skeleton.Button active className="mb-6" />
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pt-6 pb-1">
        <Title level={5} className="text-zui-silver uppercase mb-6">
          CANCELLATION POLICIES
        </Title>
        <Button
          type="default"
          icon={<EditOutlined />}
          onClick={gotoCancellationPolicyPage}
          className="mb-4"
        >
          Manage Policy
        </Button>
        <Table
          columns={columns}
          dataSource={policies || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: true }}
          className="w-full"
          locale={{
            emptyText: <Empty description="No cancellation policies found" />,
          }}
        />
      </div>
    </div>
  );
};

export default CancellationPolicy;
