import { useQueriesApi, useQueryApi } from "@zo/auth";
import { isValidString, slugify } from "@zo/utils/string";
import { Alert, Button, Drawer, Space, Tabs, Tag, Typography } from "antd";
import dayjs from "dayjs";
import React, { useMemo, useRef, useState } from "react";
import { EventGuest, Inventory, Sku } from "../../config";
import {
  EventBasicInfo,
  EventGuests,
  EventTickets,
  Questionnaire,
} from "../helpers/events";
import { OpenInNew } from "@mui/icons-material";

interface EventInfoSidebarProps {
  inventoryId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventInfoSidebar: React.FC<EventInfoSidebarProps> = ({
  inventoryId,
  isOpen,
  onClose,
}) => {
  const saveButtonRef = useRef<() => void>(() => {});
  const [activeTab, setActiveTab] = useState<string>("basicInfo");

  const {
    data: eventDetails,
    isLoading: isLoadingEventDetails,
    refetch,
  } = useQueryApi<Inventory>(
    "CAS_INVENTORY",
    {
      enabled: isOpen && inventoryId != null,
      retry: false,
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${inventoryId}/`,
    ""
  );

  const { data: allTickets } = useQueryApi(
    "CAS_SKU",
    {
      enabled: isOpen && isValidString(inventoryId),
      refetchOnWindowFocus: false,
    },
    ``,
    `inventory=${inventoryId}`
  );

  const queries = useMemo(() => {
    if (eventDetails) {
      return eventDetails?.skus.map((sku: Sku) => [
        `${sku.id}/bookings/`,
        "",
      ]) as [string, string][];
    } else {
      return [];
    }
  }, [eventDetails]);

  const guestData = useQueriesApi(
    "CAS_SKU",
    { enabled: queries && queries?.length > 0 },
    queries
  );

  const requestedCount = useMemo(() => {
    if (guestData.length > 0) {
      const data: string[] = [];
      guestData.map((guestResponse) =>
        guestResponse?.data?.data?.results?.map((guest: EventGuest) => {
          data.push(guest.id);
        })
      );
      return data;
    } else {
      return [];
    }
  }, [guestData]);

  const eventStatus = useMemo(() => {
    if (eventDetails) {
      const currentTime = dayjs();
      const startAt = dayjs(eventDetails.start_at);
      const endAt = dayjs(eventDetails.end_at);

      let statusText = "";

      if (currentTime.isBefore(startAt)) {
        statusText = "Upcoming";
      } else if (currentTime.isAfter(startAt) && currentTime.isBefore(endAt)) {
        statusText = "Live";
      } else {
        statusText = "Past Event";
      }

      return statusText;
    } else {
      return "";
    }
  }, [eventDetails]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Upcoming":
        return "blue";
      case "Live":
        return "green";
      case "Past Event":
        return "default";
      default:
        return "default";
    }
  };

  const items = [
    {
      key: "basicInfo",
      label: "Basic Info",
      children: inventoryId ? (
        <EventBasicInfo saveButtonRef={saveButtonRef} eventId={inventoryId} />
      ) : null,
    },
    {
      key: "guestInfo",
      label: (
        <span>
          Guests
          {requestedCount.length > 0 && (
            <Tag className="ml-2">{requestedCount.length}</Tag>
          )}
        </span>
      ),
      children: eventDetails ? <EventGuests event={eventDetails} /> : null,
    },
    {
      key: "questionnaire",
      label: "Questionnaire",
      children: (
        <Questionnaire
          questionnaireId={eventDetails?.questionnaire?.id || undefined}
        />
      ),
    },
    {
      key: "tickets",
      label: "Tickets",
      children: (
        <EventTickets
          operatorId={eventDetails?.operator || ""}
          data={allTickets?.data.results}
          inventoryId={inventoryId || ""}
          saveButtonRef={saveButtonRef}
        />
      ),
    },
  ];

  const eventlink = useMemo(() => {
    if (eventDetails) {
      return `${process.env.WEB_BASE_URL}/events/${slugify(
        eventDetails.name.split(" ").join("-")
      )}-${eventDetails.pid}`;
    } else {
      return "";
    }
  }, [eventDetails]);

  const renderTitle = () => {
    if (!eventDetails?.name) return "Event";

    if (eventStatus === "Live" || eventStatus === "Upcoming") {
      return (
        <a
          href={eventlink}
          target="_blank"
            rel="noopener noreferrer"
          className="flex items-center gap-2 !text-zui-white hover:!text-zui-neon group"
        >
          {eventDetails.name}
          <OpenInNew
            fontSize="small"
            className="text-zui-white group-hover:text-zui-neon"
          />
        </a>
      );
    }

    return eventDetails.name;
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      size="large"
      loading={isLoadingEventDetails}
      extra={
        saveButtonRef.current && ["basicInfo", "tickets"].includes(activeTab) && (
          <Button type="primary" onClick={() => saveButtonRef.current?.()}>
            Save
          </Button>
        )
      }
      title={
        <Space>
          <Typography.Text style={{ margin: 0, color: "white" }}>
            {renderTitle()}
          </Typography.Text>
          <Tag bordered={false} color={getStatusColor(eventStatus)}>
            {eventStatus}
          </Tag>
        </Space>
      }
    >
      {isValidString(inventoryId) ? (
        <Tabs animated items={items} onChange={setActiveTab} />
      ) : (
        <Alert message="No inventory ID found" type="warning" />
      )}
    </Drawer>
  );
};

export default EventInfoSidebar;
