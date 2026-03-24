import React from "react";
import Event from "./Event";
interface EventGroupProps {}

const EventGroup: React.FC<EventGroupProps> = () => {
  return (
    <div className="w-full grid grid-cols-4">
      <div className="flex flex-col col-span-1">
        <strong className="font-medium">Today</strong>
        <span className="text-xm text-zui-silver">Wed</span>
      </div>
      <div className="col-span-3 space-y-4">
        <Event />
        <Event />
        <Event />
      </div>
    </div>
  );
};

export default EventGroup;
