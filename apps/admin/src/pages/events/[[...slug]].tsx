import { ConfirmationNumber, EventNote } from "@mui/icons-material";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, useInfiniteTable } from "@zo/moal";
import { useVisibilityState, useWindowSize } from "@zo/utils/hooks";
import { Button, Select, Statistic, Tabs } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { EventTimeline } from "../../components/helpers/events";
import { AddEventSidebar } from "../../components/sidebars";
import { Inventory, ZoHouse } from "../../config";
import { combineRouteAndQueryParams } from "@zo/utils/string";

dayjs.extend(isSameOrAfter);

const dateSelector = (data: GeneralObject) => {
  return dayjs(data.start_at).startOf("day").toISOString();
};

const Events: NextPage = () => {
  const router = useRouter();
  const { isMobile } = useWindowSize();

  const [events, setEvents] = useState<GeneralObject[]>([]);

  const params = useMemo(() => {
    const isNewEvent = router.query.slug == "new";
    return {
      operatorId: router.query.operator as string,
      isNewEvent: isNewEvent,
      activeTab: router.query.tab as string || "upcoming",
    };
  }, [router.query]);

  const { data: operatorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_OPERATORS",
    {
      select: (data) => [
        { label: "All Zo Houses", value: "all" },
        ...data.data.results.map((operator: ZoHouse) => ({
          label: operator.name,
          value: operator.id,
        })),
      ],
      refetchOnWindowFocus: false,
    },
    "",
    "limit=100"
  );

  const { count } = useInfiniteTable({
    name: "inventory",
    queryEndpoint: "CAS_INVENTORY",
    setter: setEvents,
    customSearchQuery:
      params.operatorId && params.operatorId !== "all"
        ? `type=activity&ordering=-created_at&operator=${params.operatorId}`
        : `type=activity&ordering=-created_at`,
  });

  const pastData = useMemo(() => {
    if (events && events?.length > 0) {
      const currentDate = dayjs().startOf("day");
      return events.filter((item: GeneralObject) => {
        const startAt = dayjs(item.start_at);
        const endAt = dayjs(item.end_at);
        return (
          startAt.isValid() &&
          endAt.isValid() &&
          endAt.isBefore(currentDate, "second")
        );
      });
    } else {
      return [];
    }
  }, [events, params.operatorId]);

  const upcomingData = useMemo(() => {
    if (events && events?.length > 0) {
      const currentDate = dayjs().startOf("day");
      return events.filter((item: GeneralObject) => {
        const startAt = dayjs(item.start_at);
        const endAt = dayjs(item.end_at);
        return (
          startAt.isValid() &&
          endAt.isValid() &&
          startAt.isSameOrAfter(currentDate)
        );
      });
    } else {
      return [];
    }
  }, [events, params.operatorId]);

  const handleAddEventClose = () => {
    router.push(
      combineRouteAndQueryParams("/events", router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleAddEventClick = () => {
    router.push(
      combineRouteAndQueryParams("/events/new", router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleTabChange = (activeKey: string) => {
    const newQuery = { ...router.query, tab: activeKey };
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    const newQuery = { ...router.query };
    if (value && value !== "all") {
      newQuery[key] = value;
    } else {
      delete newQuery[key];
    }
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Page>
      <header className="flex items-center md:items-start justify-between">
        <h1 className="text-2xl font-medium">Events</h1>
        <div className="flex items-center justify-end gap-4">
          <Button
            className="md:p-4 space-x-2 flex items-center md:border border-zui-light"
            onClick={handleAddEventClick}
            icon={
              isMobile ? (
                <EventNote fontSize="small" />
              ) : (
                <ConfirmationNumber fontSize="small" />
              )
            }
          >
            {!isMobile && (
              <span className="text-xs md:text-base whitespace-nowrap">
                Create Event
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="flex items-start mt-4 py-6">
        <Statistic title="Total Events" value={count || 0} />
      </div>

      <div id="toolbar" className="flex items-center justify-start gap-4 mb-6">
        <Select
          placeholder="Zo House"
          options={operatorOptions || []}
          value={params.operatorId}
          onChange={(value) => handleFilterChange("operator", value)}
          size="large"
          className="w-48"
        />
      </div>
      <Tabs
        activeKey={params.activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "upcoming",
            label: "Upcoming",
            children: (
              <EventTimeline
                id="upcoming-events"
                className="py-6"
                data={upcomingData as Inventory[]}
                dateSelector={dateSelector}
              />
            ),
          },
          {
            key: "past",
            label: "Past",
            children: (
              <EventTimeline
                id="past-events"
                className="py-6"
                data={pastData as Inventory[]}
                dateSelector={dateSelector}
                sort="descending"
              />
            ),
          },
        ]}
      />
      <AddEventSidebar
        isOpen={params.isNewEvent}
        onClose={handleAddEventClose}
      />
    </Page>
  );
};

export default Events;
