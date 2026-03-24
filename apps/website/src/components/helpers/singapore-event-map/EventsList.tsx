import { Loader } from "@zo/assets/lotties";
import { useWindowSize } from "@zo/utils/hooks";
import { forwardRef } from "react";
import { UnifiedEventItem } from "../../../config";
import EventCard from "./EventCard";

interface EventsListProps {
  events: UnifiedEventItem[];
  isLoading: boolean;
  selectedEventId?: string;
  setSelectedEvent: React.Dispatch<
    React.SetStateAction<UnifiedEventItem | null>
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
            events.map((item) => (
              <EventCard
                key={item.id}
                isSelected={item.id === selectedEventId}
                name={item.name}
                startAt={item.date}
                startTime={item.startTime}
                endTime={item.endTime}
                subcategory={item.subcategory}
                price={String(item.price || 0)}
                onSelect={setSelectedEvent.bind(null, item)}
                icon={item.icon}
                location={item.location}
                distance={item.distance as number}
                registerLink={item.registrationLink || ''}
                navigationLink={item.navigationLink || ''}
                itemType={item.type}
                operatorName={item.operatorName}
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
