import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import Icon from "@zo/assets/icons";
import { useAuth, useQueryApi } from "@zo/auth";

import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import MonthlyChart from "./MonthlyChart";
import WeekChart from "./WeekChart";

const EventsComponent: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const getQueryParam = (param: string): string | undefined => {
    return router.query[param] as string | undefined;
  };

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [events, setEvents] = useState<string>(
    getQueryParam("events") || "week"
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const stats = [
    { label: "New Visitors", value: 5 },
    { label: "Joined", value: 2 },
  ];

  const eventFilterOptions: string[] = ["week", "month"];

  const { data: eventsData, refetch } = useQueryApi<any>(
    "CAS_REPORTS_INVENTORIES",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `type=2&from_date=${fromDate}&to_date=${toDate}&date_field=start_at`
  );

  const isIncrease = eventsData?.total > eventsData?.prev_data.total;
  const changeAmount = eventsData?.total - eventsData?.prev_data.total;
  const textColor = isIncrease ? "text-zui-green" : "text-zui-orange";
  const iconName = isIncrease ? "ArrowUp" : "ArrowDown";
  const formattedChangeAmount = isIncrease
    ? `+${changeAmount}`
    : `${changeAmount}`;

  const updateURL = (query: Record<string, string>): void => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, ...query },
    });
  };

  const handleEventClick = (event: string): void => {
    setEvents(event);
    updateURL({ events: event });
  };

  const handleCreateEvent = () => {
    router.push("/events/new");
  };

  useEffect(() => {
    if (events === "week") {
      setFromDate(moment().format("YYYY-MM-DD"));
      setToDate(moment().add(7, "days").format("YYYY-MM-DD"));
    } else if (events === "month") {
      setFromDate(moment().format("YYYY-MM-DD"));
      setToDate(moment().add(1, "month").format("YYYY-MM-DD"));
    }
  }, [events]);

  useEffect(() => {
    if (fromDate && toDate) {
      refetch();
    }
  }, [fromDate, toDate, refetch]);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const queryDateRange = getQueryParam("events");
      if (queryDateRange && queryDateRange !== events) {
        setEvents(queryDateRange);
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div className="flex flex-col p-4 border border-zui-light text-white h-full w-full  sm:w-[504px]">
      <div className="flex justify-between items-center pb-6 ">
        <h2 className="text-xl">Events</h2>
        {isMobile ? (
          <div>
            <Popover>
              <PopoverTrigger className="w-full">
                <div className="flex items-center justify-start w-full">
                  <h2 className="text-sm mr-2 capitalize">{events}</h2>
                  <Icon name="AngleDown" fill="#5A5A5A" size={16} />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zui-dark" align="start">
                <div className="flex flex-col border border-zui-light mt-1 -ml-12">
                  {eventFilterOptions
                    .filter((option) => option !== events)
                    .map((range) => (
                      <div
                        key={range}
                        className="p-2 hover:bg-zui-light bg-zui-dark cursor-pointe capitalizer"
                        onClick={() => handleEventClick(range)}
                      >
                        {range}
                      </div>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <button onClick={handleCreateEvent}>
              {" "}
              <Icon name="Event" size={24} fill="#CFFF50" />
            </button>

            {eventFilterOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleEventClick(option)}
                className={`px-4 py-2  border-zui-light border ${
                  events === option ? "bg-zui-light" : null
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row w-full h-full">
        <div className="flex flex-col w-1/2">
          <div className="flex items-center mb-6">
            <span className="text-6xl">{eventsData?.total || 0}</span>
            <span className={`ml-4 ${textColor} flex items-center`}>
              <Icon name={iconName} className="mr-1" fill="#FF9E4C" size={16} />
              {formattedChangeAmount}
            </span>
          </div>
          <div className="flex gap-10">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="text-lg">{stat.label}</span>
                <span className="text-3xl">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full sm:w-1/2 ">
          {events === "week" && <WeekChart data={eventsData && eventsData} />}
          {events === "month" && (
            <MonthlyChart data={eventsData && eventsData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsComponent;
