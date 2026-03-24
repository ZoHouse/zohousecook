import Icon from "@zo/assets/icons";
import React from "react";

interface TaskProps {}

const Task: React.FC<TaskProps> = () => {
  return (
    <div className="h-full  flex flex-col w-full sm:w-[328px] shadow-sm border border-zui-light">
      <div className="flex flex-col flex-1 overflow-y-auto px-6 py-4 md:px-4">
        <p className="text-xl font-semibold text-zui-white">4 Tasks</p>
        <div className="flex justify-between group">
          <button className="flex gap-4 py-4 relative">
            <div className="absolute top-0 -left-4 -right-4 h-full bg-zui-light hidden group-hover:flex" />
            <div className="flex flex-col">
              <div className="flex justify-between">
                <span className="text-md text-start relative">
                  Upload at least 5 property photos
                </span>
                <Icon
                  name="AngleRight"
                  size={16}
                  fill="#5A5A5A"
                  className="relative"
                />
              </div>
              <div className="flex mt-2 relative items-center">
                <div className="relative w-full h-2.5 bg-zui-silver rounded-full overflow-hidden">
                  <div
                    className="bg-zui-neon h-2.5"
                    style={{ width: "20%" }}
                  ></div>
                </div>
                <span className="ml-2 text-zui-silver text-sm">1/5</span>
              </div>
            </div>
          </button>
        </div>
        <hr />
        <div className="flex flex-col group">
          <button className="flex gap-4 py-4 relative">
            <div className="absolute top-0 -left-4 -right-4 h-full bg-zui-light hidden group-hover:flex" />
            <span className="text-md relative">Add perks</span>
          </button>
        </div>
        <hr />
        <div className="flex flex-col group">
          <button className="flex gap-4 py-4 relative">
            <div className="absolute top-0 -left-4 -right-4 h-full bg-zui-light hidden group-hover:flex" />
            <span className="text-md relative text-start">
              Update Founder member discount to 40% for private room stays
            </span>
          </button>
        </div>
        <hr />
        <div className="flex flex-col group">
          <button className="flex gap-4 py-4 relative">
            <div className="absolute top-0 -left-4 -right-4 h-full bg-zui-light hidden group-hover:flex" />
            <span className="text-md relative">
              Host at least 3 events this week
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Task;
