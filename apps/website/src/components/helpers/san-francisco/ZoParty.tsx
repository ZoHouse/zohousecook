import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { isValidString, slugify } from "@zo/utils/string";
import React, { useMemo } from "react";
import { BookingExperienceResponse } from "../../../config";
import { Button } from "../../ui";
import { ZoSFOEventCard } from "./ZoSFOEventCard";

interface ZoPartyProps {
  data: BookingExperienceResponse[];
  setIsViewAllEventsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ZoParty: React.FC<ZoPartyProps> = ({ data, setIsViewAllEventsOpen }) => {
  const { isMobile, width } = useWindowSize();

  const handleAddToCalendar = () => {
    window.open(
      "https://calendar.google.com/calendar/u/0/r?cid=http://api.lu.ma/ics/get?entity%3Dcalendar%26id%3Dcal-3YNnBTToy9fnnjQ",
      "_blank"
    );
  };
  const highlightedEvents = useMemo(() => {
    if (!data || data.length === 0) return null; // Handle empty or undefined data
    return data[0];
  }, [data]);

  const recentNineEvents = useMemo(() => {
    if (!data || data.length === 0) return []; // Ensure data exists
    return [...data].slice(0, 9);
  }, [data]);

  const sortedEventsExcludingHighlightedEvent = useMemo(() => {
    if (!data || data.length === 0) return []; // Handle empty data or missing most recent event
    return [...data].slice(1, 9);
  }, [data]);

  return (
    <>
      <div className="my-10 px-6 md:px-0">
        <div className="flex items-center justify-between mt-20 mb-6">
          <h2 className="sub-heading-2 whitespace-nowrap">Zo House Parties</h2>
          {isMobile ? (
            <button
              onClick={setIsViewAllEventsOpen.bind(null, true)}
              className="text-zui-white text-sm font-medium py-2 px-3 border border-zui-stroke rounded-full whitespace-nowrap"
            >
              View All
            </button>
          ) : (
            <div className="flex flex-row  items-center gap-6 justify-center ">
              <Button
                className="m-0"
                onClick={handleAddToCalendar}
                type="primary"
              >
                Add To Calendar
              </Button>
              <button
                onClick={setIsViewAllEventsOpen.bind(null, true)}
                className="flex items-center bg-zui-light justify-center flex-shrink-0 rounded-xl py-4 px-10 border border-zui-stroke"
              >
                View All
              </button>
            </div>
          )}
        </div>
        {isMobile ? (
          <div>
            {/* active events */}
            {highlightedEvents && isValidObject(highlightedEvents) && (
              <div>
                <ZoSFOEventCard
                  key={highlightedEvents.pid}
                  className={cn("min-w-[288px] md:min-w-full")}
                  operator={highlightedEvents.operator.name}
                  title={highlightedEvents.name}
                  time={highlightedEvents.start_at}
                  subcategory={highlightedEvents.subcategory || ""}
                  price={
                    isValidString(highlightedEvents.price)
                      ? String(highlightedEvents.price)
                      : "Free"
                  }
                  location={
                    highlightedEvents.location ||
                    highlightedEvents.operator.destination.name
                  }
                  registrationLink={
                    isValidString(highlightedEvents.luma_ref_id) &&
                    isValidString(highlightedEvents?.registration_link)
                      ? `https://lu.ma/${highlightedEvents?.registration_link}`
                      : isValidString(highlightedEvents.name) &&
                        isValidString(highlightedEvents.pid)
                      ? `${process.env.WEB_BASE_URL}/events/${slugify(
                          highlightedEvents?.name?.split(" ").join("-")
                        )}-${highlightedEvents?.pid}`
                      : ""
                  }
                  navigationLink={
                    highlightedEvents.navigation_link
                      ? highlightedEvents.navigation_link
                      : highlightedEvents.latitude &&
                        highlightedEvents.longitude
                      ? `https://www.google.com/maps/dir/?api=1&destination=${highlightedEvents.latitude},${highlightedEvents.longitude}`
                      : ""
                  }
                  size="sm"
                  image={highlightedEvents.media?.[0]?.url || ""}
                  tags={highlightedEvents.tags}
                />
              </div>
            )}

            {/* upcoming events */}
            {sortedEventsExcludingHighlightedEvent.length > 0 && (
              <div className="overflow-x-auto mt-6 hide-scrollbar">
                <div className="flex space-x-6 items-center snap-x snap-mandatory">
                  {sortedEventsExcludingHighlightedEvent?.map(
                    (event, index) => {
                      // generate regiseration Link
                      const _registrationLink =
                        isValidString(event.luma_ref_id) &&
                        isValidString(event?.registration_link)
                          ? `https://lu.ma/${event?.registration_link}`
                          : isValidString(event.name) &&
                            isValidString(event.pid)
                          ? `${process.env.WEB_BASE_URL}/events/${slugify(
                              event?.name?.split(" ").join("-")
                            )}-${event?.pid}`
                          : "";

                      // generate navigation Link using latitude and longitude
                      const _navigationLink = event.navigation_link
                        ? event.navigation_link
                        : event.latitude && event.longitude
                        ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
                        : "";

                      return (
                        <div
                          className="snap-center"
                          key={index}
                          style={{
                            width: `${width - 48}px`,
                            minWidth: "280px",
                            maxWidth: "400px",
                          }}
                        >
                          <ZoSFOEventCard
                            key={event.pid}
                            className={cn("min-w-[288px] md:min-w-full")}
                            operator={event.operator.name}
                            title={event.name}
                            time={event.start_at}
                            subcategory={event.subcategory || ""}
                            price={
                              isValidString(event.price)
                                ? String(event.price)
                                : "Free"
                            }
                            location={
                              event.location || event.operator.destination.name
                            }
                            registrationLink={_registrationLink}
                            navigationLink={_navigationLink}
                            size="sm"
                            image={event.cover_image || ""}
                            tags={event.tags}
                          />{" "}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {recentNineEvents.length > 0 ? (
              <div className="grid grid-cols-4 grid-rows-3 gap-6">
                {recentNineEvents?.map((event, index) => {
                  // generate regiseration Link
                  const _registrationLink =
                    isValidString(event.luma_ref_id) &&
                    isValidString(event?.registration_link)
                      ? `https://lu.ma/${event?.registration_link}`
                      : isValidString(event.name) && isValidString(event.pid)
                      ? `${process.env.WEB_BASE_URL}/events/${slugify(
                          event?.name?.split(" ").join("-")
                        )}-${event?.pid}`
                      : "";

                  // generate navigation Link using latitude and longitude
                  const _navigationLink = event.navigation_link
                    ? event.navigation_link
                    : event.latitude && event.longitude
                    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
                    : "";
                  return (
                    <ZoSFOEventCard
                      key={event.pid}
                      className={index === 0 ? "col-span-2 row-span-2" : ""}
                      operator={event.operator.name}
                      title={event.name}
                      time={event.start_at}
                      subcategory={event.subcategory || ""}
                      price={
                        isValidString(event.price)
                          ? String(event.price)
                          : "Free"
                      }
                      location={
                        event.location || event.operator.destination.name
                      }
                      registrationLink={_registrationLink}
                      navigationLink={_navigationLink}
                      size={index === 0 ? "lg" : "sm"}
                      image={event.cover_image || ""}
                      tags={event.tags}
                    />
                  );
                })}
              </div>
            ) : (
              <div>
                <h2>No Upcoming Events</h2>
              </div>
            )}
          </>
        )}

        <Button
          className="md:hidden mt-6 w-full"
          onClick={handleAddToCalendar}
          type="primary"
        >
          Add To Calendar
        </Button>
      </div>
    </>
  );
};

export default ZoParty;
