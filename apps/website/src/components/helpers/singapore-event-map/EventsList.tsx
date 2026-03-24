import { Loader } from "@zo/assets/lotties";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidString, slugify } from "@zo/utils/string";
import { forwardRef } from "react";
import { BookingExperienceResponse } from "../../../config";
import EventCard from "./EventCard";

interface EventsListProps {
  events: BookingExperienceResponse[];
  isLoading: boolean;
  selectedEventId?: string;
  setSelectedEvent: React.Dispatch<
    React.SetStateAction<BookingExperienceResponse | null>
  >;
}

const EventsList = forwardRef<HTMLDivElement, EventsListProps>(
  ({ events, isLoading, selectedEventId, setSelectedEvent }, ref) => {
    const { isMobile } = useWindowSize();

    return (
      <div className="absolute bottom-6 w-screen md:bottom-0 md:right-0 md:top-10 md:w-[420px] z-90">
        {!isMobile && (
          <div className="bg-gradient-to-l from-zui-dark to-transparent absolute inset-0" />
        )}
        <div
          ref={ref}
          className="snap-x snap-mandatory relative w-full h-full px-6 overflow-x-auto hide-scrollbar z-10 flex flex-nowrap gap-6 items-end md:overflow-y-auto md:flex-col md:snap-y md:py-6"
        >
          {isLoading ? (
            <div className="md:absolute md:inset-0 w-full py-8 md:z-10 flex flex-col items-center justify-center">
              <Loader className="w-8 h-8" />
              <span className="text-zui-white mt-2">Loading events...</span>
            </div>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event.pid}
                isSelected={event.pid === selectedEventId}
                name={event.name}
                startAt={event.start_at}
                subcategory={event.subcategory}
                price={String(event.price)}
                onSelect={setSelectedEvent.bind(null, event)}
                icon={event.icon}
                location={event.location}
                distance={event.distance}
                registerLink={
                  isValidString(event.registration_link)
                    ? event.registration_link
                    : `${process.env.WEB_BASE_URL}/events/${slugify(
                        event.name.split(" ").join("-")
                      )}-${event.pid}`
                }
                navigationLink={event.navigation_link}
              />
            ))
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
    );
  }
);

EventsList.displayName = "EventsList";

export default EventsList;
