import Typo from "@zo/coal/typography";
import { cn } from "@zo/utils/font";
import React, { ReactNode, useState } from "react";

interface TabsProps {
  children: ReactNode | ReactNode[];
  isStepwise?: boolean;
  filled?: number[];
}

const Tabs: React.FC<TabsProps> = ({ children, isStepwise, filled = [] }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-row gap-x-2 w-full sticky top-0">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            const isFilled = isStepwise
              ? filled.indexOf(index) !== -1
              : index === activeTab;
            return (
              <button
                key={index}
                className="flex flex-col gap-y-1 flex-1"
                onClick={handleClick.bind(null, index)}
              >
                <Typo
                  type="subtitle"
                  className={
                    activeTab === index ? "text-zui-white" : "text-zui-silver"
                  }
                >
                  {child.props.title}
                </Typo>
                <div
                  className={cn(
                    "h-1 w-full",
                    isFilled ? "bg-zui-white" : "bg-zui-silver"
                  )}
                />
              </button>
            );
          }
        })}
      </div>
      <>{React.Children.toArray(children)[activeTab]}</>
    </div>
  );
};

export default Tabs;
