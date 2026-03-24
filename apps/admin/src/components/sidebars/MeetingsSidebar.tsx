import { Drawer, Flex, Typography, Button } from "antd";
import {
  NotificationsOutlined,
  BadgeOutlined,
  RadioButtonCheckedOutlined,
  PhoneOutlined,
  CalendarTodayOutlined,
  AccessTimeOutlined,
  DescriptionOutlined,
} from "@mui/icons-material";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import moment from "moment";
import React from "react";
import { Meeting } from "../../config";

const { Text, Title } = Typography;

interface MeetingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
}

const MeetingsSidebar: React.FC<MeetingsSidebarProps> = ({
  isOpen,
  meeting,
  onClose,
}) => {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={
        <Title level={4} style={{ margin: 0 }}>
          {meeting.data?.scheduled_event?.name || "Meetings"}
        </Title>
      }
      width={400}
    >
      <Flex vertical gap={16}>
        <Flex align="center" gap={8}>
          <NotificationsOutlined />
          <Text strong>{formatCapitalize(meeting.medium).replace("-", " ")}</Text>
        </Flex>

        <Flex align="center" gap={8}>
          <BadgeOutlined />
          <Text strong>Status: {formatCapitalize(meeting.status)}</Text>
        </Flex>

        {isValidString(meeting.cancellation_reason) && (
          <Flex align="center" gap={8}>
            <RadioButtonCheckedOutlined />
            <Text strong>
              Cancellation Reason:{" "}
              {formatCapitalize(meeting.cancellation_reason)}
            </Text>
          </Flex>
        )}

        <Flex align="center" gap={8}>
          <PhoneOutlined />
          <Text strong>{meeting.location.phone}</Text>
        </Flex>

        <Flex align="center" gap={8}>
          <CalendarTodayOutlined />
          <Text strong>
            <a
              href={meeting.data.event}
              style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
            >
              {meeting.data.event}
            </a>
          </Text>
        </Flex>

        <Flex vertical gap={1} style={{ marginTop: 24 }}>
          <Flex
            style={{
              padding: 16,
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: 4,
            }}
            gap={8}
          >
            <AccessTimeOutlined />
            <Flex vertical>
              <Text strong>Date & time</Text>
              <Text type="secondary">
                {moment(meeting.scheduled_start).format("ddd D MMM\n   h A")}
              </Text>
            </Flex>
          </Flex>

          <Flex
            style={{
              padding: 16,
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: 4,
            }}
            gap={8}
          >
            <DescriptionOutlined />
            <Flex vertical>
              <Text strong>Notes</Text>
              <Text type="secondary">-</Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex justify="flex-end" style={{ marginTop: 24 }}>
          <Button
            type="link"
            danger
            href={meeting.data.cancel_url}
            style={{ padding: 0 }}
          >
            Cancel
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
};

export default MeetingsSidebar;
