import Icon from "@zo/assets/icons";
import { Spot } from "apps/admin/src/config";
import React from "react";

interface EventsAllowListProps {
  data?: Spot[]
}

const EventsAllowList: React.FC<EventsAllowListProps> = ({data}) => {

  
  return (
    <div className="pt-6">
      <div className="">
        <div className="w-full max-w-[400px] flex gap-3 items-center justify-between border border-zui-light bg-zui-lighter p-4">
          <Icon name="Ethereum" size={24} />
          <p className="flex-grow">0xa1...4CC2</p>
          <button className=" flex items-center justify-center cursor-pointer text-xs text-zui-neon">
            <Icon name="NewTab" size={24} fill={"#fff"} />
          </button>
        </div>
        <div className="w-full max-w-[400px] flex gap-3 items-center justify-between border border-zui-light bg-zui-lighter p-4">
          <Icon name="Ethereum" size={24} />
          <p className="flex-grow">0xa1...4CC2</p>
          <button className=" flex items-center justify-center cursor-pointer text-xs text-zui-neon">
            <Icon name="NewTab" size={24} fill={"#fff"} />
          </button>
        </div>
        <div className="w-full max-w-[400px] flex gap-3 items-center justify-between border border-zui-light bg-zui-lighter p-4">
          <Icon name="Ethereum" size={24} />
          <p className="flex-grow">0xa1...4CC2</p>
          <button className=" flex items-center justify-center cursor-pointer text-xs text-zui-neon">
            <Icon name="NewTab" size={24} fill={"#fff"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsAllowList;
