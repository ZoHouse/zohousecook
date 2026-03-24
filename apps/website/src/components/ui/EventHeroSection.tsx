import React from "react";
import { Select } from ".";
import EventGroup from "./EventGroup";

interface EventHeroSectionProps {}

const EventHeroSection: React.FC<EventHeroSectionProps> = () => {
  return (
    <section className="my-[26px] md:my-10 w-full mx-auto">
      <h1 className="zui-heading-1">Events</h1>
      {/* <h1 className="text-2xl font-semibold leading-9 md:zui-heading-1">Events</h1> */}
      <div className="md:grid grid-cols-4 justify-between gap-[72px] w-full mt-7">
        <div className="col-span-3">
          <div className="hidden md:visible flex gap-6">
            <Select
              className="w-28"
              placeholder="Date"
              options={[{ value: "some_value", label: "some label" }]}
            />
            <Select
              className="w-28"
              placeholder="Type"
              options={[{ value: "some_value", label: "some label" }]}
            />
          </div>
          <div className="mt-4 md:mt-[105px] space-y-10 md:space-y-20">
            <EventGroup />
            <EventGroup />
          </div>
        </div>
        <div className="hidden md:visible col-span-1">
          <Select
            className="w-60"
            placeholder="Search by Zo House"
            options={[{ value: "some_value", label: "some label" }]}
          />
        </div>
      </div>
    </section>
  );
};

export default EventHeroSection;
