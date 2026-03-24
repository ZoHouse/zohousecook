import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Tag } from "antd";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { PartnerCancellationPolicySidebar } from "../../sidebars";

interface CancellationPolicyProps {
  operatorId: string | undefined;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    default:
      return "default";
  }
};

const CancellationPolicy: React.FC<CancellationPolicyProps> = ({
  operatorId,
}) => {
  const [selectedCancellationPolicyId, setSelectedCancellationPolicyId] =
    useState<string | null>(null);

  const [
    isAddCancellationPolicyVisible,
    showAddCancellationPolicy,
    hideAddCancellationPolicy,
  ] = useVisibilityState();

  const {
    data: policies,
    isLoading,
    refetch,
  } = useQueryApi<GeneralObject[]>(
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

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Inventory",
        dataIndex: "inventory",
        key: "inventory",
        render: (_, record) =>
          isValidString(record?.inventory?.name) ? record.inventory.name : "-",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (_, data) => {
          return <Tag color={getStatusColor(data?.status)}>{data?.status}</Tag>;
        },
      },
      {
        title: "Start At",
        dataIndex: "start_at",
        key: "start_at",
        render: (date) => (
          <span title={moment(date).format("LLL")}>
            {moment(date).startOf("day").fromNow()}
          </span>
        ),
      },
      {
        title: "End At",
        dataIndex: "end_at",
        key: "end_at",
        render: (date) => (
          <span title={moment(date).format("LLL")}>
            {moment(date).startOf("day").fromNow()}
          </span>
        ),
      },
      {
        title: "Min Days",
        dataIndex: "min_hours_till_start",
        key: "min_hours_till_start",
        render: (hours: number) => {
          if (!hours) return "-";
          const days = Math.max(
            1,
            Number(moment.duration(hours, "hours").asDays().toFixed(0))
          );
          return `${days}d`;
        },
      },
      {
        title: "Max Days",
        dataIndex: "max_hours_till_start",
        key: "max_hours_till_start",
        render: (hours: number) => {
          if (!hours) return "-";
          const days = Math.max(
            1,
            Number(moment.duration(hours, "hours").asDays().toFixed(0))
          );
          return `${days}d`;
        },
      },
      {
        title: "Cancellation Charge %",
        dataIndex: "cancellation_charge",
        key: "cancellation_charge",
      },
      {
        title: "Created At",
        dataIndex: "created_at",
        key: "created_at",
        render: (date) => (
          <span title={moment(date).format("LLL")}>
            {moment(date).startOf("day").fromNow()}
          </span>
        ),
      },
    ],
    []
  );

  const handleRowClick = (record: GeneralObject) => {
    setSelectedCancellationPolicyId(record.id);
    showAddCancellationPolicy();
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Cancellation Policy"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Cancellation Policy",
            onClick: showAddCancellationPolicy,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <ZudTable
          data={policies || []}
          isLoading={isLoading}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={(record) => handleRowClick(record)}
        />
      </PageContent>
      <PartnerCancellationPolicySidebar
        cancellationPolicyId={selectedCancellationPolicyId}
        isOpen={isAddCancellationPolicyVisible}
        onClose={() => {
          hideAddCancellationPolicy();
          setSelectedCancellationPolicyId(null);
        }}
        operatorId={operatorId}
        refetch={refetch}
      />
    </div>
  );
};

export default CancellationPolicy;
