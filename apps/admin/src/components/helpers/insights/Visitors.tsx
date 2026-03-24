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

const Visitors: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const getQueryParam = (param: string): string | undefined => {
    return router.query[param] as string | undefined;
  };

  const [visitors, setVisitors] = useState<string>(
    getQueryParam("visitors") || "day"
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const visitorFilterOptions: string[] = ["day", "week", "month"];

  const { data: visitorsData, refetch } = useQueryApi<any>(
    "CAS_REPORTS_VISITS",
    {
      refetchOnWindowFocus: false,
      enabled: isLoggedIn !== null && !!fromDate && !!toDate,
      select: (data) => data.data,
    },
    "",
    `from_date=${fromDate}&to_date=${toDate}&date_field=checkin_time`
  );

  const isIncrease = visitorsData?.total > visitorsData?.prev_data.total;
  const changeAmount = visitorsData?.total - visitorsData?.prev_data.total;
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

  const handleVisitorsClick = (visitor: string): void => {
    setVisitors(visitor);
    updateURL({ visitors: visitor });
  };

  const handleAddVisitors = () => {
    router.push("/visitors/new");
  };

  useEffect(() => {
    if (visitors === "week") {
      setFromDate(moment().format("YYYY-MM-DD"));
      setToDate(moment().add(7, "days").format("YYYY-MM-DD"));
    } else if (visitors === "month") {
      setFromDate(moment().format("YYYY-MM-DD"));
      setToDate(moment().add(1, "month").format("YYYY-MM-DD"));
    } else if (visitors === "day") {
      setFromDate(moment().format("YYYY-MM-DD"));
      setToDate(moment().add(1, "days").format("YYYY-MM-DD"));
    }
  }, [visitors, getQueryParam]);

  useEffect(() => {
    if (fromDate && toDate) {
      refetch();
    }
  }, [fromDate, toDate, refetch]);

  useEffect(() => {
    if (router.isReady) {
      const queryDateRange = getQueryParam("visitors");
      if (queryDateRange && queryDateRange !== visitors) {
        setVisitors(queryDateRange);
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div className="flex flex-col p-4 border border-zui-light text-white h-full w-full sm:w-[240px]">
      <div className="flex justify-between items-center pb-6 ">
        <h2 className="text-xl">Visitors</h2>

        <div>
          <Popover>
            <PopoverTrigger className="w-full">
              <div className="flex items-center justify-start w-full">
                <h2 className="text-sm mr-2 capitalize">{visitors}</h2>
                <Icon name="AngleDown" fill="#5A5A5A" size={16} />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-zui-dark" align="start">
              <div className="flex flex-col border border-zui-light mt-1 -ml-12">
                {visitorFilterOptions
                  .filter((option) => option !== visitors)
                  .map((range) => (
                    <div
                      key={range}
                      className="p-2 hover:bg-zui-light bg-zui-dark cursor-pointer capitalize"
                      onClick={() => handleVisitorsClick(range)}
                    >
                      {range}
                    </div>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex flex-col ">
        <div className="flex items-center mb-6">
          <span className="text-6xl">{visitorsData?.total || 0}</span>
          <span className={`ml-4 ${textColor} flex items-center`}>
            <Icon name={iconName} className="mr-1" fill="#FF9E4C" size={16} />
            {formattedChangeAmount}
          </span>
        </div>
        <hr className="mt-8" />
        <div className="flex space-x-6">
          <button
            onClick={handleAddVisitors}
            className="flex items-center justify-center cursor-pointer mt-4"
          >
            <Icon name="Plus" size={16} fill="#CFFF50" />
            <span className="text-zui-neon text-md ml-2">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Visitors;
