import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { cn } from "@zo/utils/font";
import { isValidString, slugify } from "@zo/utils/string";
import moment from "moment";
import React, { forwardRef, useMemo, useState } from "react";
import { BookingExperienceResponse } from "../../../config";
import { rubikClassName } from "../../utils";
import CategoryFilter from "../singapore-event-map/CategoryFilter";
import DateFilter from "../singapore-event-map/DateFilter";
import { ZoSFOEventCard } from "./ZoSFOEventCard";

interface EventSidebarProps {
  events: BookingExperienceResponse[];
  isLoading: boolean;
  selectedEventId?: string;
  setSelectedEvent: React.Dispatch<
    React.SetStateAction<BookingExperienceResponse | null>
  >;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  selectedCategory: string;
  dateOptions: Array<{ label: string; value: string }>;
  categoryOptions: Array<{ label: string; value: string }>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setIsViewAllEventsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  eventListClassName?: string;
  sidebarClassName?: string;
}

const EventSidebar = forwardRef<HTMLDivElement, EventSidebarProps>(
  (
    {
      events,
      isLoading,
      selectedEventId,
      setSelectedEvent,
      categoryOptions,
      dateOptions,
      selectedDate,
      setSelectedCategory,
      selectedCategory,
      setSelectedDate,
      searchTerm,
      setSearchTerm,
      setIsViewAllEventsOpen,
      eventListClassName,
      sidebarClassName,
    },
    ref
  ) => {
    const searchInputRef = React.createRef<HTMLInputElement>();

    const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

    const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> = (
      e
    ) => {
      e.preventDefault();
      setSearchTerm(e.target.value);
    };

    const handleEventClick = (event: BookingExperienceResponse) => {
      setSelectedEvent(event);
    };

    const handleCloseSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      setSearchTerm(""); // Clear the search term
      setIsSearchActive(false); // Deactivate search mode
    };

    const groupedEvents = useMemo(() => {
      return events.reduce((acc, event) => {
        const date = new Date(event.start_at).toDateString(); // Group by date
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(event);
        return acc;
      }, {} as Record<string, BookingExperienceResponse[]>);
    }, [events]);

    return (
      <>
        <div
          className={cn(
            "absolute bottom-4 w-screen md:bottom-0 md:right-0 md:top-10 md:w-[312px] z-20 md:p-6 flex-1",
            sidebarClassName
          )}
        >
          <div className="h-full relative w-full">
            <div className="hidden md:flex justify-start items-center gap-4 relative">
              <div
                className={cn(
                  `flex items-center justify-center bg-zui-light border border-zui-stroke rounded-xl px-4 transition-all duration-300`,
                  isSearchActive ? "w-[264px]" : "w-[148px]"
                )}
              >
                <Icon name="Search" size={24} fill="#5a5a5a" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={setIsSearchActive.bind(null, true)}
                  onBlur={setIsSearchActive.bind(null, false)}
                  className="p-4 bg-transparent w-full focus:outline-none flex-1 placeholder:text-zui-silver"
                />
                {isValidString(searchTerm) && (
                  <button
                    onClick={handleCloseSearch}
                    className="ml-4 p-2 rounded-full bg-zui-lighter z-100 absolute top-1/2 right-2 -translate-y-1/2"
                  >
                    <Icon name="Cross" size={18} fill="#fff" />
                  </button>
                )}
              </div>
              {!isSearchActive && (
                <button
                  onClick={setIsViewAllEventsOpen.bind(null, true)}
                  className="flex items-center bg-zui-light justify-center flex-shrink-0 rounded-xl p-4 border border-zui-stroke"
                >
                  View All
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center justify-center gap-4 my-3 z-90 relative">
              <DateFilter
                options={dateOptions || []}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                optionsContainerClassName="z-100"
                className="w-32"
              />

              {categoryOptions?.length > 1 && (
                <CategoryFilter
                  className="w-32"
                  options={categoryOptions || []}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  optionsContainerClassName="z-100"
                />
              )}
            </div>
            <div
              ref={ref}
              className={cn(
                "snap-x snap-mandatory relative w-full h-full overflow-x-auto hide-scrollbar flex flex-nowrap items-end md:overflow-y-scroll md:flex-col md:snap-y md:max-h-[75vh]",
                eventListClassName
              )}
            >
              {isLoading ? (
                <div className="md:absolute md:inset-0 w-full py-8 md:z-10 flex flex-col items-center justify-center">
                  <Loader className="w-8 h-8" />
                  <span className="text-zui-white mt-2">Loading events...</span>
                </div>
              ) : events.length > 0 ? (
                Object.keys(groupedEvents).map(
                  (time: string, index: number) => (
                    <>
                      <h3
                        className={cn(
                          "hidden md:block text-xs font-medium mt-4 self-start",
                          rubikClassName
                        )}
                      >
                        {moment(time).format("MMM D yy / dddd")}{" "}
                      </h3>
                      {groupedEvents[time].map((event, index) => {
                        // generate registration Link
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
                          <ZoSFOEventCard
                            id={event.pid}
                            key={event.pid}
                            onClick={handleEventClick.bind(null, event)}
                            className={cn(
                              "min-w-[300px] w-full md:min-w-[264px] snap-center mx-4 md:mx-0 md:my-2",
                              selectedEventId === event.pid && "border-zui-neon"
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
                            registrationLink={_registrationLink}
                            navigationLink={_navigationLink}
                            size="sm"
                            image={event.cover_image || ""}
                            tags={event.tags}
                          />
                        );
                      })}
                    </>
                  )
                )
              ) : (
                <div className="md:absolute md:inset-0 w-full py-8 md:z-10 flex flex-col items-center justify-center">
                  <picture>
                    <source
                      srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f915/512.webp"
                      type="image/webp"
                    />
                    <img
                      src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f915/512.gif"
                      alt="🤕"
                      width="56"
                      height="56"
                    />
                  </picture>
                  <span className="text-zui-white/90 mt-6 text-center">
                    Couldn&apos;t find any events.
                    <br />
                    Try changing the filters.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
);

EventSidebar.displayName = "EventSidebar";

export default EventSidebar;
