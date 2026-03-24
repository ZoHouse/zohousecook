import {
  Button,
  Card,
  Col,
  Drawer,
  Progress,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import React from "react";
import {
  AddEntryForm,
  CSVUpload,
  EntriesTable,
  useVibeCuratorReward,
} from "../helpers/vibe-curator";

const { Text } = Typography;

export interface VibeCuratorRewardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const VibeCuratorRewardSidebar: React.FC<VibeCuratorRewardSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    Form,
    rewardEntries,
    isProcessing,
    processedCount,
    activeFilter,
    setActiveFilter,
    selectedRowKeys,
    setSelectedRowKeys,
    stats,
    filteredEntries,
    entriesToProcess,
    handleClose,
    handleAddEntry,
    handleRemoveEntry,
    handleRemoveSelected,
    handleCSVUpload,
    handleProcessAllEntries,
  } = useVibeCuratorReward(onClose);

  const statsList = [
    { label: "Total", value: stats.total },
    {
      label: "Success",
      value: stats.success,
      valueStyle: { color: "#66df48" },
    },
    {
      label: "Failed",
      value: stats.failed,
      valueStyle: { color: "#ff4545" },
    },
    {
      label: "Pending",
      value: stats.pending,
      valueStyle: { color: "#ffd600" },
    },
  ];

  return (
    <Drawer
      title="Bulk Vibe Curator Rewards"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={1100}
      extra={
        <Button
          type="primary"
          onClick={handleProcessAllEntries}
          loading={isProcessing}
          disabled={entriesToProcess === 0}
          size="large"
        >
          {isProcessing ? "Processing..." : `Process (${entriesToProcess})`}
        </Button>
      }
    >
      {/* Progress Bar */}
      {isProcessing && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <Row align="middle" gutter={16}>
            <Col flex="auto">
              <Progress
                percent={Math.round((processedCount / entriesToProcess) * 100)}
                status="active"
                strokeColor="#fff"
                trailColor="rgba(255,255,255,0.3)"
                showInfo={false}
              />
            </Col>
            <Col>
              <Text style={{ color: "#fff", fontWeight: 500 }}>
                Processing {processedCount} of {entriesToProcess}
              </Text>
            </Col>
          </Row>
        </Card>
      )}
      <Row gutter={16}>
        {/* Left Panel - Form & Upload */}
        <Col span={8}>
          <AddEntryForm form={Form} onAddEntry={handleAddEntry} />
          <CSVUpload onUpload={handleCSVUpload} />
        </Col>

        <Col span={16}>
          {statsList.length > 0 && (
            <Row gutter={12} style={{ marginBottom: 16 }}>
              {statsList.map((stat) => (
                <Col key={stat.label} span={6}>
                  <Statistic
                    title={stat.label}
                    value={stat.value}
                    valueStyle={stat.valueStyle}
                  />
                </Col>
              ))}
            </Row>
          )}
          {stats.total > 0 && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Space>
                    <Text type="secondary">Total Credits:</Text>
                    <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                      {stats.totalCredits.toLocaleString()}
                    </Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space>
                    <Text type="secondary">Total $Zo:</Text>
                    <Text strong style={{ color: "#722ed1", fontSize: 16 }}>
                      {stats.totalZo.toLocaleString()}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}
          <EntriesTable
            entries={rewardEntries}
            filteredEntries={filteredEntries}
            stats={stats}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            onRemoveEntry={handleRemoveEntry}
            onRemoveSelected={handleRemoveSelected}
          />
        </Col>
      </Row>
    </Drawer>
  );
};

export default VibeCuratorRewardSidebar;
