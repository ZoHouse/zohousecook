import Icon from "@zo/assets/icons";

import { Sidebar } from "@zo/moal";
import { isValidString, slugify } from "@zo/utils/string";
import moment from "moment";
import React, { memo, useMemo } from "react";
import { BookingExperienceResponse } from "../../../config";
import { cn, rubikClassName } from "../../utils";
import CategoryFilter from "../singapore-event-map/CategoryFilter";
import DateFilter from "../singapore-event-map/DateFilter";
import { ZoSFOEventCard } from "./ZoSFOEventCard";

interface ViewEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsData: BookingExperienceResponse[];
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  selectedCategory: string;
  dateOptions: Array<{ label: string; value: string }>;
  categoryOptions: Array<{ label: string; value: string }>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  searchTerm: string;
  isLoading: boolean;
  selectedEvent?: BookingExperienceResponse | null;
  setSelectedEvent: React.Dispatch<
    React.SetStateAction<BookingExperienceResponse | null>
  >;
}

const ViewEventsModal: React.FC<ViewEventsModalProps> = ({
  isOpen,
  onClose,
  categoryOptions,
  dateOptions,
  eventsData,
  isLoading,
  searchTerm,
  selectedCategory,
  selectedDate,
  setSearchTerm,
  setSelectedCategory,
  setSelectedDate,
  setSelectedEvent,
  selectedEvent,
}) => {
  const groupedEvents = useMemo(() => {
    return eventsData.reduce((acc, event) => {
      const date = new Date(event.start_at).toDateString(); // Group by date
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, BookingExperienceResponse[]>);
  }, [eventsData]);

  const ZoSFOEventCardMemo = memo(ZoSFOEventCard); // Memoize the ZoSFOEventCard

  return (
    <Sidebar
      scrollableChildren={false}
      className="z-100"
      isOpen={isOpen}
      onClose={onClose}
    >
      <button
        onClick={onClose}
        className="hidden md:block absolute top-6 right-6"
      >
        <Icon name="Cross" size={24} fill="#fff" />
      </button>
      <div className="relative flex flex-col flex-shrink-0 h-full">
        <div className="md:hidden mt-10 flex items-center justify-between">
          <h2 className="text-2xl text-zui-white font-semibold leading-8">
            Events
          </h2>

          <button onClick={onClose}>
            <Icon name="Cross" size={16} fill="#fff" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-start md:justify-start gap-6 md:items-center flex-shrink-0 my-6 md:mt-10">
          <div className="flex  items-center w-full md:w-[600px] bg-zui-light border border-zui-lightest rounded-xl px-4 flex-shrink-0">
            <Icon name="Search" size={24} fill="#5a5a5a" />
            <input
              type="text"
              placeholder="Search Event"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-4 bg-transparent w-[full] focus:outline-none flex-1 placeholder:text-zui-silver"
            />
            {isValidString(searchTerm) && (
              <button
                onClick={() => setSearchTerm("")}
                className="ml-4 p-2 rounded-full bg-zui-lighter"
              >
                <Icon name="Cross" size={18} fill="#fff" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-start gap-4 flex-shrink-0">
            <DateFilter
              options={dateOptions || []}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              optionsContainerClassName="z-100"
              className="w-32"
            />
            {categoryOptions?.length > 1 && (
              <CategoryFilter
                options={categoryOptions || []}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                optionsContainerClassName="z-100"
                className="w-32"
              />
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.keys(groupedEvents).map((time: string) => (
            <div key={time}>
              <h3
                className={cn(
                  "text-xs font-medium my-4 mt-10 text-zui-white",
                  rubikClassName
                )}
              >
                {moment(time).format("MMM D yy / dddd")}{" "}
                {/* Changed "Do" to "D" */}
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {groupedEvents[time]?.map(
                  (event: BookingExperienceResponse, index) => {
                    // generate registration Link

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
                      <ZoSFOEventCardMemo // Use the memoized version
                        key={event.pid}
                        onClick={setSelectedEvent.bind(null, event)}
                        className={cn(
                          "min-w-[288px] md:min-w-full snap-start",
                          selectedEvent?.pid === event.pid && "border-zui-neon"
                        )}
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
                        navigationLink={_navigationLink}
                        size="sm"
                        image={event.cover_image || ""}
                        registrationLink={_registrationLink}
                        tags={event.tags}
                      />
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
};

export default ViewEventsModal;
