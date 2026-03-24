import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { ZudColumnType, ZudTable } from "@zo/zud";
import {
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useMemo } from "react";

const { Text } = Typography;

export interface RewardEntry {
  id: string;
  mobile_country_code: string;
  mobile_number: string;
  credits: number;
  $zo: number;
  status: "pending" | "processing" | "success" | "failed";
  error?: string;
}

export type FilterType = "all" | "pending" | "success" | "failed";

export interface RewardStats {
  total: number;
  pending: number;
  success: number;
  failed: number;
  processing: number;
  totalCredits: number;
  totalZo: number;
}

interface EntriesTableProps {
  entries: RewardEntry[];
  filteredEntries: RewardEntry[];
  stats: RewardStats;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  onRemoveEntry: (id: string) => void;
  onRemoveSelected: () => void;
}

const EntriesTable: React.FC<EntriesTableProps> = ({
  entries,
  filteredEntries,
  stats,
  activeFilter,
  setActiveFilter,
  selectedRowKeys,
  setSelectedRowKeys,
  onRemoveEntry,
  onRemoveSelected,
}) => {
  // Toggle row selection
  const toggleRowSelection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys((prev) => [...prev, id]);
    } else {
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
    }
  };

  // Toggle all selection
  const toggleAllSelection = (checked: boolean) => {
    if (checked) {
      const selectableIds = filteredEntries
        .filter((e) => e.status !== "processing")
        .map((e) => e.id);
      setSelectedRowKeys(selectableIds);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const allSelected =
    filteredEntries.length > 0 &&
    filteredEntries
      .filter((e) => e.status !== "processing")
      .every((e) => selectedRowKeys.includes(e.id));

  // Get status tag
  const getStatusTag = (status: RewardEntry["status"]) => {
    const config = {
      pending: { color: "default", icon: null, text: "Pending" },
      processing: {
        color: "processing",
        icon: <LoadingOutlined />,
        text: "Processing",
      },

      success: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Success",
      },
      failed: { color: "error", icon: <CloseCircleOutlined />, text: "Failed" },
    };
    const { color, icon, text } = config[status];
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };

  // Table columns
  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: (
          <Checkbox
            checked={allSelected}
            indeterminate={
              selectedRowKeys.length > 0 &&
              selectedRowKeys.length <
                filteredEntries.filter((e) => e.status !== "processing").length
            }
            onChange={(e) => toggleAllSelection(e.target.checked)}
          />
        ) as unknown as string,
        dataIndex: "id",
        key: "select",
        width: 40,
        render: (id, record) => (
          <Checkbox
            checked={selectedRowKeys.includes(id)}
            disabled={record.status === "processing"}
            onChange={(e) => toggleRowSelection(id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },

      {
        title: "Country Code",
        dataIndex: "mobile_country_code",
        key: "mobile_country_code",
        width: 140,
        render: (countryCode) => {
          return <Text copyable={{ text: countryCode }}>{countryCode}</Text>;
        },
      },
      {
        title: "Mobile",
        dataIndex: "mobile_number",
        key: "mobile_number",
        width: 140,
        render: (phone) => {
          return <Text copyable={{ text: phone }}>{phone}</Text>;
        },
      },
      {
        title: "Credits",
        dataIndex: "credits",
        key: "credits",
        width: 100,
        render: (credits) => <Text>{credits}</Text>,
      },
      {
        title: "$Zo",
        dataIndex: "$zo",
        key: "$zo",
        width: 100,
        render: (zo) => <Text>{zo}</Text>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => getStatusTag(status),
      },
      {
        title: "Error",
        dataIndex: "error",
        key: "error",
        width: 200,
        ellipsis: true,
        render: (error) =>
          error && (
            <Tooltip title={error}>
              <Text type="danger" style={{ fontSize: 12 }}>
                {error}
              </Text>
            </Tooltip>
          ),
      },
      {
        title: "Actions",
        key: "actions",
        dataIndex: "id",
        width: 70,
        fixed: "right",
        render: (_, record) =>
          record.status === "pending" ? (
            <Tooltip title="Remove">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveEntry(record.id);
                }}
              />
            </Tooltip>
          ) : null,
      },
    ],
    [allSelected, selectedRowKeys, filteredEntries, onRemoveEntry]
  );

  return (
    <Card
      size="small"
      title={
        <Tabs
          activeKey={activeFilter}
          onChange={(key) => setActiveFilter(key as FilterType)}
          size="small"
          items={[
            { key: "all", label: `All (${stats.total})` },
            { key: "pending", label: `Pending (${stats.pending})` },
            { key: "success", label: `Success (${stats.success})` },
            { key: "failed", label: `Failed (${stats.failed})` },
          ]}
          style={{ marginBottom: 0 }}
        />
      }
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex justify-end my-2">
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button
              icon={<DeleteOutlined />}
              onClick={onRemoveSelected}
              danger
              size="small"
            >
              Remove ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </div>
      {entries.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No entries added yet"
          style={{ padding: 40 }}
        >
          <Text type="secondary">
            Add entries manually or upload a CSV file
          </Text>
        </Empty>
      ) : (
        <div style={{ maxHeight: 450, overflowY: "auto" }}>
          <ZudTable
            columns={columns}
            data={filteredEntries}
            keyExtractor={(row) => row.id}
            rowClassName={(record) =>
              record.status === "processing" ? "processing-row" : ""
            }
          />
        </div>
      )}
    </Card>
  );
};

export default EntriesTable;
