import { Portal } from "@radix-ui/react-select";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn, fontClassName } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { getFullName, isValidString } from "@zo/utils/string";
import debounce from "lodash.debounce";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { useAssociation } from "../../hooks";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { selectedOperator } = useAssociation();

  const [searchValue, setSearchValue] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setLoading] = useState<boolean>(false);

  const {
    data: searchResults,
    isLoading: isSearching,
    remove: removeSearchResults,
  } = useQueryApi<GeneralObject[]>(
    "ADMIN_PM_BOOKING_SEARCH",
    {
      enabled:
        isValidString(searchQuery.trim()) &&
        searchQuery.trim().length >= 2 &&
        isValidObject(selectedOperator),
      select: (data) => data.data,
    },
    "",
    `operator=${selectedOperator?.id}&q=${searchQuery}`
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9@.\s-]*$/.test(value)) {
      if (value.length >= 2) {
        setLoading(true);
      }
      setSearchValue(value);
    }
  };

  const clearSearch = () => {
    removeSearchResults();
    setSearchValue("");
    inputRef.current?.focus();
  };

  const openBooking = (code: string) => {
    router.push(`/overview/${code}`);
  };

  useEffect(() => {
    const debounced = debounce(() => setSearchQuery(searchValue), 1000);
    debounced();

    return () => {
      debounced.cancel();
    };
  }, [searchValue]);

  useEffect(() => {
    if (!isSearching && isLoading) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      clearSearch();
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
            fontClassName,
            "fixed z-20 top-0 right-0 bottom-0 left-0 items-center flex flex-col"
          )}
        >
          <div
            className="fixed top-0 right-0 bottom-0 left-0 bg-zui-dark/80"
            onClick={onClose}
          />
          <CSSTransition
            classNames="fade-up-fast"
            in={isOpen}
            unmountOnExit
            mountOnEnter
            timeout={150}
            nodeRef={pageRef}
            appear
          >
            <main
              ref={pageRef}
              className={cn(
                "relative flex flex-col mt-24 md:mt-48 w-[calc(100%-48px)] lg:w-[500px]",
                ""
              )}
            >
              <div className="flex items-center relative gap-4 h-16 px-4 bg-zui-dark border border-zui-light">
                <Icon name="Search" size={24} fill="#5A5A5A" />
                <input
                  ref={inputRef}
                  className="flex-1 h-full outline-none focus:outline-none bg-zui-dark placeholder:text-zui-silver"
                  placeholder="Search Booking, User, Checkin ..."
                  value={searchValue}
                  onChange={handleChange}
                />
                {searchValue.length > 0 ? (
                  isLoading ? (
                    <Loader className="absolute top-5 right-4 w-6 h-6" />
                  ) : (
                    <button
                      className="flex items-center justify-center"
                      onClick={clearSearch}
                    >
                      <Icon name="CrossCircle" size={20} fill="#5A5A5A" />
                    </button>
                  )
                ) : null}
              </div>
              {!isSearching && searchValue.length >= 2 && (
                <div className="flex flex-col max-h-[50vh] overflow-y-auto bg-zui-lighter border border-zui-light border-t-0 divide-y divide-zui-light">
                  {searchResults ? (
                    searchResults.length > 0 ? (
                      searchResults.map((booking) => (
                        <button
                          key={booking.code}
                          className="flex items-start gap-3 p-4"
                          onClick={openBooking.bind(null, booking.code)}
                        >
                          <div className="flex flex-col items-start flex-1 gap-1">
                            <span className="px-2 py-1 text-xs bg-zui-silver rounded-xl text-left">
                              {booking.code}
                              {isValidString(booking?.meta_details?.ezee_id)
                                ? ` / ${booking.meta_details.ezee_id}`
                                : ""}
                            </span>
                            <span className="text-left">
                              {booking.checkins
                                .map((c: GeneralObject) =>
                                  getFullName(c.profile)
                                )
                                .join(", ")}
                            </span>
                            <span className="text-sm text-zui-silver text-left">
                              {booking.guests
                                .map((c: GeneralObject) => getFullName(c))
                                .join(", ")}
                            </span>
                            <span className="text-xs text-zui-silver">
                              {moment(booking.start_date).format("DD MMM")} →{" "}
                              {moment(booking.end_date).format("DD MMM")}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <span className="px-6 py-8 text-center text-zui-silver text-sm">
                        No Results Found
                      </span>
                    )
                  ) : null}
                </div>
              )}
            </main>
          </CSSTransition>
        </section>
      </CSSTransition>
    </Portal>
  );
};

export default GlobalSearch;
