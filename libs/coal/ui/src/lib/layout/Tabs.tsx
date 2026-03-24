import Typo from "@zo/coal/typography";
import React from "react";

interface TabsProps {}

const Tabs: React.FC<TabsProps> = () => {
  return (
    <div className="w-fit border-zui-light border p-2 flex items-center">
      <button className="px-4 h-8 flex items-center bg-zui-light">
        <Typo type="tertiary">
          Active <span className="text-zui-neon pl-1">8</span>
        </Typo>
      </button>
      <button className="px-4 h-8 flex items-center">
        <Typo type="tertiary">
          Upcoming <span className="text-zui-neon pl-1">12</span>
        </Typo>
      </button>
      <button className="px-4 h-8 flex items-center">
        <Typo type="tertiary">Past</Typo>
      </button>
    </div>
  );
};

export default Tabs;
