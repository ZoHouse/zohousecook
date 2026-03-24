import moment from "moment";
import React from "react";

interface DateCount {
  formatted_date: string;
  count: number;
}

interface ChartData {
  count_per_date: DateCount[];
  prev_data: {
    count_per_date: DateCount[];
  };
}

interface ChartProps {
  data: ChartData;
}

const getDayName = (date: string): string => moment(date).format("dddd");
const startOfPreviousWeek = moment()
  .subtract(1, "week")
  .startOf("week")
  .add(1, "days");
const endOfPreviousWeek = moment()
  .subtract(1, "week")
  .endOf("week")
  .add(1, "days");
const startOfCurrentWeek = moment().startOf("week").add(1, "days");
const endOfCurrentWeek = moment().endOf("week").add(1, "days");

const previousWeekRange = `${startOfPreviousWeek.format(
  "DD"
)} → ${endOfPreviousWeek.format("DD MMM")}`;
const currentWeekRange = `${startOfCurrentWeek.format(
  "DD"
)} → ${endOfCurrentWeek.format("DD MMM")}`;

const initializeEvents = (events: DateCount[]) => {
  const eventArray: { [key: string]: number } = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  };

  events?.forEach(({ formatted_date, count }) => {
    const dayName = getDayName(formatted_date);
    eventArray[dayName] += count;
  });

  return eventArray;
};

const WeekChart: React.FC<ChartProps> = ({ data }) => {
  const daysMap: { [key: number]: string } = {
    0: "M",
    1: "T",
    2: "W",
    3: "T",
    4: "F",
    5: "S",
    6: "S",
  };

  const lastWeekEvents = initializeEvents(data?.prev_data?.count_per_date);
  const thisWeekEvents = initializeEvents(data?.count_per_date);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="flex flex-col items-center text-zui-silver">
      <div className="flex justify-between w-full mb-2">
        <span className="text-xs">{previousWeekRange}</span>
        <span className="text-xs ml-4">{currentWeekRange}</span>
      </div>
      <div className=" flex items-center space-x-4">
        <div className="flex flex-col items-center">
          {days.map((day, index) => (
            <div key={index} className="h-5 flex items-center space-x-1">
              {Array(lastWeekEvents[day]).fill(
                <span className="block w-4 h-4 rounded-full bg-zui-orange" />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center">
          {days.map((day, index) => (
            <span key={index} className="h-5 flex text-xs items-center">
              {daysMap[index]}
            </span>
          ))}
        </div>
        <div className="flex flex-col items-center">
          {days.map((day, index) => (
            <div key={index} className="h-5 flex items-center space-x-1">
              {Array(thisWeekEvents[day]).fill(
                <span className="block w-4 h-4 rounded-full bg-zui-green" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekChart;
