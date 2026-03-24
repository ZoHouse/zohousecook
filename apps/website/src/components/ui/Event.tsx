import Icon from "@zo/assets/icons";
import { useRouter } from "next/router";
import React from "react";
import patterns from "../../patterns";

interface EventProps {}

const sampleImage =
  "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const Event: React.FC<EventProps> = () => {
  const router = useRouter();
  const handleCardDetail = () => {
    router.push("events/12345");
  };
  return (
    <div
      onClick={handleCardDetail}
      className="px-6 py-4 md:w-[704px] flex flex-col-reverse md:flex-row justify-between items-center bg-zui-lighter cursor-pointer relative overflow-hidden border border-transparent hover:border-zui-silver "
    >
      <div className="flex-grow z-10">
        <div>
          <span className="text-sm ">2.00 PM</span>
          <h5 className="text-2xl">Copy writing</h5>
        </div>
        <div className="mt-6 space-y-4">
          <span className="flex text-zui-silver text-sm items-center gap-3">
            <Icon name="Ticket" size={24} fill="#5A5A5A" />
            Workshop
          </span>
          <span className="flex text-zui-silver text-sm items-center gap-3">
            <Icon name="Location" size={24} fill="#5A5A5A" />
            Degen Lounge, Zo House Kormangala
          </span>
        </div>
      </div>
      <div className="w-[245px] h-[140px] z-10">
        <img
          className="w-full h-full object-cover"
          src={sampleImage}
          height={245}
          width={140}
          alt="event"
        />
      </div>
      <img
        className="w-full h-full object-cover absolute"
        src={patterns.curvesLarge.src}
        height={200}
        width={704}
        alt="event"
      />
    </div>
  );
};

export default Event;
