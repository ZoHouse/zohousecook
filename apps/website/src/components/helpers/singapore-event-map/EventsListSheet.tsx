import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { cn } from "@zo/utils/font";
import { formatCapitalize, isValidString, slugify } from "@zo/utils/string";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import { BookingExperienceResponse } from "../../../config";
import { rubikClassName } from "../../utils";
import DateFilter from "./DateFilter";

interface EventsListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: BookingExperienceResponse | null;
  filteredEvents: BookingExperienceResponse[] | undefined;
  isLoading: boolean;
  categoryOptions: Array<{ label: string; value: string }> | undefined;
  setSelectedCategory: (category: string) => void;
  selectedCategory: string;
  setSelectedDate: (date: string) => void;
  allEvents: BookingExperienceResponse[] | undefined;
  selectedDate: string;
  dateOptions: Array<{ label: string; value: string }>;
  setSelectedEvent: (event: BookingExperienceResponse | null) => void;
}

const EventsListSheet: React.FC<EventsListSheetProps> = ({
  isOpen,
  categoryOptions,
  isLoading,
  filteredEvents,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedDate,
  setSelectedDate,
  allEvents,
  dateOptions,
  setSelectedEvent,
  selectedEvent,
}) => {
  const [numberOfEventsListed, setNumberOfEventsListed] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const searchFilteredEvents = useMemo(
    () =>
      searchTerm.length > 2 && allEvents
        ? allEvents.filter((event) =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : filteredEvents,
    [searchTerm, allEvents, filteredEvents]
  );

  const handleLoadMoreEvents = () => {
    if (!filteredEvents) {
      return;
    }

    if (numberOfEventsListed < filteredEvents?.length - 20) {
      setNumberOfEventsListed((prev) => prev + 20);
    } else if (filteredEvents?.length - numberOfEventsListed < 20) {
      setNumberOfEventsListed(
        (prev) => prev + (filteredEvents?.length - numberOfEventsListed)
      );
    }
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
  };

  return (
    <BottomSheet
      open={isOpen}
      className="custom-bottom-sheet"
      onDismiss={handleClose}
      snapPoints={({ maxHeight, minHeight }) => [minHeight, maxHeight * 0.9]}
    >
      {selectedEvent ? (
        <div className="p-4 my-8 relative">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium flex-1 truncate whitespace-normal overflow-hidden text-ellipsis">
                {selectedEvent.name}
              </span>
              <button className="absolute -top-6 right-6" onClick={onClose}>
                <Icon name="Cross" size={24} fill="#fff" />
              </button>
            </div>
            <div className="flex gap-8 items-center mt-2 text-sm text-gray-400">
              <div className="flex items-center">
                <span className="mr-2">🕒</span>
                <p className="text-sm text-zui-silver">
                  {moment(selectedEvent.start_at).format("lll")}
                </p>
              </div>

              <div className="flex items-center justify-start">
                <span>💰</span>
                <p className="text-sm text-zui-silver">
                  {selectedEvent.price || "Free"}
                </p>
              </div>
            </div>
            {isValidString(selectedEvent.location) && (
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <span className="mr-2">📍</span>
                <p className="text-sm text-zui-silver">
                  {" "}
                  {selectedEvent.location}
                </p>
              </div>
            )}
          </div>

          <div className="flex mt-4 space-x-4">
            {selectedEvent.category === "listing"
              ? isValidString(selectedEvent.registration_link) && (
                  <a
                    href={selectedEvent.registration_link}
                    target="_blank"
                    className="px-4 py-2 bg-white text-black rounded-full"
                  >
                    Register
                  </a>
                )
              : isValidString(selectedEvent.pid) && (
                  <a
                    href={`${process.env.WEB_BASE_URL}/events/${slugify(
                      selectedEvent.name.split(" ").join("-")
                    )}-${selectedEvent.pid}`}
                    target="_blank"
                    className="px-4 py-2 bg-white text-black rounded-full"
                  >
                    Register
                  </a>
                )}
            {isValidString(selectedEvent.navigation_link) && (
              <a
                href={selectedEvent.navigation_link}
                target="_blank"
                className="px-4 py-2 border border-white text-white rounded-full"
              >
                Get Directions
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 mb-8 relative">
          <div className="flex items-center justify-between">
            <h4
              className={cn("text-2xl font-semibold leading-8", rubikClassName)}
            >
              Events
            </h4>

            <div className="flex items-center gap-x-4">
              <DateFilter
                options={dateOptions}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              <button onClick={onClose}>
                <Icon name="Cross" size={18} fill="#fff" />
              </button>
            </div>
          </div>
          <div className="flex items-center bg-zui-light border my-6 border-zui-stroke rounded-xl">
            <input
              type="text"
              placeholder="Search Event"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-4 bg-transparent w-full focus:outline-none flex-1"
            />
            {isValidString(searchTerm) && (
              <button
                onClick={() => setSearchTerm("")}
                className="mx-4 p-2 rounded-full bg-zui-lighter"
              >
                <Icon name="Cross" size={18} fill="#fff" />
              </button>
            )}
          </div>
          <div className="flex justify-start items-center gap-4 overflow-x-scroll hide-scrollbar my-4">
            {categoryOptions?.map((category) => (
              <button
                onClick={setSelectedCategory.bind(null, category.value)}
                className={cn(
                  "px-4 py-2 rounded-full border whitespace-nowrap",
                  selectedCategory === category.value
                    ? "border-zui-white"
                    : "border-zui-stroke"
                )}
                key={category.value}
              >
                {formatCapitalize(category.label)}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="w-8" />
              </div>
            ) : searchFilteredEvents && searchFilteredEvents.length > 0 ? (
              searchFilteredEvents
                ?.slice(0, numberOfEventsListed)
                ?.map((event: BookingExperienceResponse) => (
                  <div
                    role="button"
                    onClick={setSelectedEvent.bind(null, event)}
                    className="border border-zui-stroke p-4 rounded-2xl"
                    key={event?.pid}
                  >
                    <div>
                      <span className="text-base font-medium flex-1 truncate whitespace-normal overflow-hidden text-ellipsis">
                        {event.name}
                      </span>
                      <div className="flex gap-8 items-center mt-2 text-sm text-gray-400">
                        <div className="flex items-center">
                          <span className="mr-2">🕒</span>
                          <p className="text-sm text-zui-silver">
                            {moment(event.start_at).format("MMM D, h:mm A")}
                          </p>
                        </div>

                        <div className="flex items-center justify-start">
                          <span>💰</span>
                          <p className="text-sm text-zui-silver">
                            {event.price || "Free"}
                          </p>
                        </div>
                      </div>
                      {isValidString(event.location) && (
                        <div className="flex items-center mt-2 text-sm text-gray-400">
                          <span className="mr-2">📍</span>
                          <p className="text-sm text-zui-silver">
                            {" "}
                            {event.location}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex mt-4 space-x-4">
                      {event.category === "listing"
                        ? isValidString(event.registration_link) && (
                            <a
                              href={event.registration_link}
                              target="_blank"
                              className="px-4 py-2 bg-white text-black rounded-full"
                            >
                              Register
                            </a>
                          )
                        : isValidString(event.pid) && (
                            <a
                              href={`${
                                process.env.WEB_BASE_URL
                              }/events/${slugify(
                                event.name.split(" ").join("-")
                              )}-${event.pid}`}
                              target="_blank"
                              className="px-4 py-2 bg-white text-black rounded-full"
                            >
                              Register
                            </a>
                          )}

                      {isValidString(event.navigation_link) && (
                        <a
                          href={event.navigation_link}
                          target="_blank"
                          className="px-4 py-2 border border-white text-white rounded-full"
                        >
                          Get Directions
                        </a>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6 text-zui-silver">
                No events found.
              </div>
            )}

            {searchTerm.length === 0 &&
              searchFilteredEvents &&
              searchFilteredEvents?.length > 0 && (
                <button
                  onClick={handleLoadMoreEvents}
                  className="bg-zui-white py-2 mt-10 mx-auto px-3 text-sm font-semibold text-zui-light rounded-full flex justify-start items-center gap-2"
                >
                  Load More Events.
                </button>
              )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

export default EventsListSheet;
