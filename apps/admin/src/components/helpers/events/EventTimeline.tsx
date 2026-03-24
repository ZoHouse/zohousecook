import { Event } from "@mui/icons-material";
import { GeneralObject } from "@zo/definitions/general";
import { groupObjectsByKeySelector } from "@zo/utils/array";
import { cn } from "@zo/utils/font";
import { combineRouteAndQueryParams, isValidUUID } from "@zo/utils/string";
import { Empty, Typography } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { EventCard } from ".";
import { Inventory } from "../../../config";
import { EventInfoSidebar } from "../../sidebars";

interface EventTimelineProps {
  id: string;
  className?: string;
  data: Inventory[];
  dateSelector: (data: GeneralObject) => string;
  sort?: "ascending" | "descending";
}

const EventTimeline: React.FC<EventTimelineProps> = ({
  id,
  className,
  data = [],
  dateSelector,
  sort = "ascending",
}) => {
  const router = useRouter();

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [eventId, mode] = slug;

      return {
        event_id: eventId || null,
        mode: mode || null,
      };
    }
    return {
      event_id: null,
      mode: null,
    };
  }, [router.query]);

  const dateWiseData = useMemo(
    () => groupObjectsByKeySelector(data, dateSelector),
    [data]
  );

  const handleCardClick = (data: GeneralObject) => {
    router.push(
        combineRouteAndQueryParams(`${data.id}/edit`, router.query),
        undefined,
        { shallow: true }
      );
  };

  const handleEventInfoClose = () => {
    router.push(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      <div className={cn("flex flex-col space-y-6 md:space-y-16", className)}>
        {Object.keys(dateWiseData).length > 0 ? (
          Object.keys(dateWiseData)
            .sort((event1, event2) =>
              sort === "ascending"
                ? moment(event1).valueOf() - moment(event2).valueOf()
                : moment(event2).valueOf() - moment(event1).valueOf()
            )
            .map((date: string) => {
              const inventories: Inventory[] = dateWiseData[date];
              return (
                <div className="grid grid-cols-4 gap-6" key={date}>
                  <div className="col-span-1 space-x-2">
                    <Typography.Text
                      strong
                      style={{ margin: 0 }}
                      className="text-lg"
                    >
                      {moment(date).format("DD MMM")}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {moment(date).format("ddd")}
                    </Typography.Text>
                  </div>
                  <div className="col-span-3 space-y-6">
                    {inventories.map((inventory) => (
                      <EventCard
                        onClick={handleCardClick.bind(null, inventory)}
                        key={inventory.id}
                        data={inventory}
                      />
                    ))}
                  </div>
                </div>
              );
            })
        ) : (
          <Empty
            image={<Event style={{ fontSize: 48, opacity: 0.5 }} />}
            description={
              <Typography.Text type="secondary">
                No {id === "past-events" ? "Past" : "Upcoming"} Events
              </Typography.Text>
            }
            className="py-10"
          />
        )}
      </div>
      <EventInfoSidebar
        inventoryId={params.event_id}
        isOpen={isValidUUID(params.event_id)}
        onClose={handleEventInfoClose}
      />
    </>
  );
};

export default EventTimeline;
