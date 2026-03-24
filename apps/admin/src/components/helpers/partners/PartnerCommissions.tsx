import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQueryApi } from "@zo/auth";
import { Currency } from "@zo/definitions/admin";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Tag, Tooltip } from "antd";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";
import dayjs from "dayjs";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { PartnerCommissionsSidebar } from "../../sidebars";
import { StatusCell } from "../../ui";

interface PartnerCommissionsProps {
  operatorId: string | undefined;
  currency: Currency;
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

const PartnerCommissions: React.FC<PartnerCommissionsProps> = ({
  operatorId,
  currency,
}) => {
  const [selectedCommissionId, setSelectedCommissionId] = useState<
    string | null
  >(null);

  const [isAddCommissionVisible, showAddCommission, hideAddCommission] =
    useVisibilityState();

  const {
    data: commissions,
    isLoading,
    refetch,
  } = useQueryApi<GeneralObject[]>(
    "CAS_OPERATORS",
    {
      enabled: isValidString(operatorId),
      select(data) {
        return data.data.results;
      },
      refetchOnWindowFocus: false,
    },
    `${operatorId}/commissions/`,
    `operator=${operatorId}`
  );

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          return (
            <Tag color={getStatusColor(status)}>
              <span className="uppercase">{status}</span>
            </Tag>
          );
        },
      },

      {
        title: "Start From",
        dataIndex: "applicable_from",
        key: "applicable_from",
        render: (date: string) => (
          <span>{dayjs(date).format("DD MMM YYYY")}</span>
        ),
      },
      {
        title: "End Date",
        dataIndex: "applicable_till",
        key: "applicable_till",
        render: (date) => <span>{dayjs(date).format("DD MMM YYYY")}</span>,
      },
      {
        title: "title",
        dataIndex: "title",
        key: "title",
        render: (title) => <span>{title || "N/A"}</span>,
      },
      {
        key: "amount",
        title: "Amount",
        dataIndex: "amount",
        render: (cell, row) => {
          if (row?.commission_type === "percentage") {
            return `${row.percent_amount}%`;
          }
          return formatCurrencyPrice(cell, row?.currency);
        },
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
    ],
    []
  );

  const handleRowClick = (record: GeneralObject) => {
    setSelectedCommissionId(record.id);
    showAddCommission();
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Commissions"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Commissions",
            onClick: showAddCommission,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <ZudTable
          data={commissions || []}
          isLoading={isLoading}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={(record) => handleRowClick(record)}
        />
      </PageContent>
      <PartnerCommissionsSidebar
        commissionId={selectedCommissionId}
        isOpen={isAddCommissionVisible}
        onClose={() => {
          hideAddCommission();
          setSelectedCommissionId(null);
        }}
        operatorId={operatorId}
        refetch={refetch}
        currency={currency}
      />
    </div>
  );
};

export default PartnerCommissions;
