import { Portal } from "@radix-ui/react-select";
import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { formatCapitalize, isValidString, slugify } from "@zo/utils/string";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { BookingExperienceResponse } from "../../../config";
import { rubikClassName } from "../../utils";
import DateFilter from "./DateFilter";
import EventCard from "./EventCard";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  events: BookingExperienceResponse[];
  dateOptions: { label: string; value: string; icon?: string }[];
  categoryOptions?: { label: string; value: string }[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  events,
  dateOptions,
  categoryOptions,
}) => {
  const searchInputRef = React.createRef<HTMLInputElement>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const pageRef = React.useRef<HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDate, setSelectedDate] = useState("all");

  // Filter events based on the search term
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const eventStartDate = moment(event.start_at);
      const eventEndDate = moment(event.end_at);

      const isCategoryMatch =
        selectedCategory === "All"
          ? true
          : event.subcategory?.toLowerCase() === selectedCategory.toLowerCase();

      const isDateMatch =
        selectedDate !== "all"
          ? moment(selectedDate).isBetween(
              eventStartDate,
              eventEndDate,
              "date",
              "[]"
            )
          : true;

      return isCategoryMatch && isDateMatch;
    });

    return searchTerm.length > 0
      ? filtered.filter((event) =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filtered;
  }, [events, searchTerm, selectedCategory, selectedDate]);

  const { isMobile } = useWindowSize();

  // close when ESC pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Portal>
      <CSSTransition
        classNames="fade-in"
        in={isOpen}
        unmountOnExit
        mountOnEnter
        timeout={300}
        nodeRef={overlayRef}
        appear
      >
        <section
          ref={overlayRef}
          className={cn(
            rubikClassName,
            "fixed z-50 top-0 right-0 bottom-0 left-0"
          )}
        >
          <div
            className="fixed top-0 right-0 bottom-0 left-0 bg-zui-dark/80"
            onClick={onClose}
          />
          <CSSTransition
            classNames={isMobile ? "fade-left" : "fade-right"}
            in={isOpen}
            unmountOnExit
            mountOnEnter
            timeout={300}
            nodeRef={pageRef}
            appear
          >
            <aside
              ref={pageRef}
              className={cn(
                "fixed bg-zui-lighter top-0 left-0 bottom-0 flex flex-col w-[420px] max-w-full",
                ""
              )}
            >
              <div className="flex items-center justify-between mx-6 mt-8">
                <h4
                  className={cn(
                    "text-2xl font-semibold leading-8",
                    rubikClassName
                  )}
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
                    <Icon name="Cross" size={24} fill="#fff" />
                  </button>
                </div>
              </div>
              <div className="flex items-center bg-zui-light border border-zui-lightest rounded-xl px-4 mx-6 flex-shrink-0 mt-4">
                <Icon name="Search" size={24} fill="#5a5a5a" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search Event"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-4 bg-transparent w-full focus:outline-none flex-1 placeholder:text-zui-silver"
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
              <div className="flex justify-start items-center gap-4 overflow-x-scroll hide-scrollbar mt-4 px-6">
                {categoryOptions?.map((category) => (
                  <button
                    onClick={setSelectedCategory.bind(null, category.value)}
                    className={cn(
                      "px-4 py-2 rounded-full border whitespace-nowrap",
                      selectedCategory === category.value
                        ? "border-zui-white"
                        : "border-zui-lightest"
                    )}
                    key={category.value}
                  >
                    {formatCapitalize(category.label)}
                  </button>
                ))}
              </div>
              <ul
                id="search-results"
                className="flex flex-col gap-y-4 mt-4 flex-1 overflow-y-auto px-6 pb-6"
              >
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <EventCard
                      key={event.pid}
                      isSelected={false}
                      name={event.name}
                      startAt={event.start_at}
                      isInSearch
                      subcategory={event.subcategory}
                      price={String(event.price)}
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
                  <div className="flex flex-col items-center justify-center mt-12">
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
                    <p className="text-center mt-6 max-w-[50%] text-zui-silver">
                      Couldn&apos;t find any events matching your search
                    </p>
                  </div>
                )}
              </ul>
            </aside>
          </CSSTransition>
        </section>
      </CSSTransition>
    </Portal>
  );
};

export default SearchBar;
