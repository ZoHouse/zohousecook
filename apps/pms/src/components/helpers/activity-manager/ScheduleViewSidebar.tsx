import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Image,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React from "react";

const { Title, Text, Paragraph } = Typography;

interface ScheduleViewSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string | null;
  onDeleted: () => void;
  onViewActivity: (activityId: string) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const WEEKDAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const MONTH_LABELS: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

const ScheduleViewSidebar: React.FC<ScheduleViewSidebarProps> = ({
  isOpen,
  onClose,
  scheduleId,
  onDeleted,
  onViewActivity,
}) => {
  const { data, isLoading } = useQueryApi<GeneralObject>(
    "CAS_INVENTORY_SCHEDULES",
    { enabled: !!scheduleId && isOpen, select: (resp) => resp.data },
    `${scheduleId || ""}/`
  );

  const { mutate: deleteSchedule, isLoading: isDeleting } = useMutationApi(
    "CAS_PM_INVENTORY_SCHEDULES",
    {},
    "",
    "DELETE"
  );

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Schedule?",
      content: (
        <div>
          <Paragraph>
            Are you sure you want to delete this schedule? This action cannot be
            undone.
          </Paragraph>
          <Paragraph type="warning" strong>
            Warning: All future activities created by this schedule will be
            deleted.
          </Paragraph>
        </div>
      ),
      okText: "Delete Schedule",
      okButtonProps: { danger: true, loading: isDeleting },
      cancelText: "Cancel",
      onOk: () => {
        return new Promise((resolve, reject) => {
          deleteSchedule(
            { data: {}, route: `${scheduleId}/` },
            {
              onSuccess: () => {
                onDeleted();
                onClose();
                resolve(null);
              },
              onError: (error) => {
                console.error("Failed to delete schedule:", error);
                reject(error);
              },
            }
          );
        });
      },
    });
  };

  const getRecurrenceDisplay = () => {
    if (!data) return null;

    const { frequency, weekdays, monthdays, months } = data;

    if (frequency === "WEEKLY" && weekdays && weekdays.length > 0) {
      return (
        <Space wrap>
          {weekdays.map((day: string) => (
            <Tag key={day} color="blue">
              {WEEKDAY_LABELS[day] || day}
            </Tag>
          ))}
        </Space>
      );
    }

    if (frequency === "MONTHLY" && monthdays && monthdays.length > 0) {
      return (
        <Space wrap>
          {monthdays.map((day: number) => (
            <Tag key={day} color="green">
              Day {day}
            </Tag>
          ))}
        </Space>
      );
    }

    if (frequency === "YEARLY" && months && months.length > 0) {
      return (
        <Space wrap>
          {months.map((month: number) => (
            <Tag key={month} color="purple">
              {MONTH_LABELS[month] || `Month ${month}`}
            </Tag>
          ))}
        </Space>
      );
    }

    return <Text type="secondary">—</Text>;
  };

  const inventory = data?.inventory;
  const firstImage = inventory?.media?.[0];

  return (
    <Drawer
      title={data?.name ?? "Schedule Details"}
      placement="right"
      size="large"
      onClose={onClose}
      open={isOpen}
      loading={isLoading}
      extra={
        <Space>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={isDeleting}
          >
            Delete Schedule
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* Schedule Information */}
        <div>
          <Title level={4} className="!mb-4">
            Schedule Information
          </Title>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Schedule Name">
              {data?.name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Frequency">
              <Tag color="cyan">
                {FREQUENCY_LABELS[data?.frequency] || data?.frequency}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Interval">
              Every {data?.interval || 1}{" "}
              {data?.frequency === "WEEKLY"
                ? "week(s)"
                : data?.frequency === "MONTHLY"
                ? "month(s)"
                : "year(s)"}
            </Descriptions.Item>
            <Descriptions.Item label="Recurrence">
              {getRecurrenceDisplay()}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {data?.created_at
                ? dayjs(data.created_at).format("DD MMM YYYY, HH:mm")
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {data?.updated_at
                ? dayjs(data.updated_at).format("DD MMM YYYY, HH:mm")
                : "—"}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Associated Activity */}
        {inventory && (
          <div>
            <Title level={4} className="!mb-3">
              Associated Activity
            </Title>
            <Card
              hoverable
              onClick={() => onViewActivity(inventory.id)}
              cover={
                firstImage ? (
                  <div style={{ height: 200, overflow: "hidden" }}>
                    <Image
                      src={firstImage.url}
                      alt={inventory.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      preview={false}
                    />
                  </div>
                ) : null
              }
              actions={[
                <Button
                  key="view"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewActivity(inventory.id);
                  }}
                >
                  View Activity Details
                </Button>,
              ]}
            >
              <Card.Meta
                title={
                  <Space direction="vertical" size={2}>
                    <Text strong>{inventory.name}</Text>
                    <Space size={4}>
                      <Tag
                        color={
                          inventory.status === "active" ? "green" : "orange"
                        }
                      >
                        {inventory.status}
                      </Tag>
                      {inventory.pid && (
                        <Tag color="default">{inventory.pid}</Tag>
                      )}
                    </Space>
                  </Space>
                }
                description={
                  <Paragraph
                    ellipsis={{ rows: 3 }}
                    className="!mb-0"
                    style={{ marginTop: 8 }}
                  >
                    {inventory.description ||
                      inventory.short_description ||
                      "—"}
                  </Paragraph>
                }
              />
            </Card>
          </div>
        )}
      </Space>
    </Drawer>
  );
};

export default ScheduleViewSidebar;
