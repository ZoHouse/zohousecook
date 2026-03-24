import { cn } from "@zo/utils/font";
import gsap from "gsap";
import React, { useEffect, useMemo, useRef, useState } from "react";

export interface TabsConfigData {
  id: string;
  title: string;
  titleCount?: number;
  component?: React.ReactNode;
}
export interface TabsProps {
  className?: string;
  tabHeaderClassName?: string;
  tabBodyClassName?: string;
  data: TabsConfigData[];
  initialTabId?: string;
  onTabChange?: (newTabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  data,
  initialTabId,
  className,
  tabHeaderClassName,
  tabBodyClassName,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    initialTabId || data[0]?.id
  );
  const activeIndicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const currentTab = useMemo(
    () => data?.find((tab) => tab.id === activeTab),
    [activeTab, data]
  );

  const handleTabChange = (newTabId: string) => {
    if (newTabId === activeTab) return;

    const currentIndex = data.findIndex((tab) => tab.id === activeTab);
    const newIndex = data.findIndex((tab) => tab.id === newTabId);
    const direction = newIndex > currentIndex ? 1 : -1;

    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { x: `${direction * 100}%`, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "back.out(0.6)" }
      );
    }

    setActiveTab(newTabId);

    if (onTabChange) {
      onTabChange(newTabId);
    }
  };

  useEffect(() => {
    if (activeIndicatorRef.current && tabRefs.current[activeTab]) {
      const activeTabElement = tabRefs.current[activeTab];
      const indicator = activeIndicatorRef.current;

      gsap.to(indicator, {
        x: activeTabElement?.offsetLeft,
        width: activeTabElement?.offsetWidth,
        duration: 0.3,
        ease: "back.out(0.6)",
      });
    }
  }, [activeTab]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div
        className={cn(
          "w-full md:max-w-fit md:w-fit flex flex-shrink-0 items-center justify-between gap-6 pb-6 hide-scrollbar overflow-hidden",
          tabHeaderClassName
        )}
      >
        <div className="h-12 px-2 flex flex-shrink-0 items-center border-zui-light border w-full overflow-x-scroll relative">
          {data.map((tab: TabsConfigData) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[tab.id] = el)}
              onClick={() => handleTabChange(tab.id)}
              className={`h-8 w-content justify-center px-4 flex items-center space-x-2 relative z-10`}
            >
              <span className="text-xs whitespace-nowrap">{tab.title}</span>
              {tab.titleCount != null && (
                <span className="text-zui-neon text-xs">{tab.titleCount}</span>
              )}
            </button>
          ))}
          <div
            ref={activeIndicatorRef}
            className="absolute  left-0 h-8 bottom-2 bg-zui-light transition-colors"
            style={{ width: 0 }}
          />
        </div>
      </div>
      <hr />
      <div className={cn("flex-1 overflow-auto", tabBodyClassName)}>
        <div ref={contentRef} className="h-full">
          {currentTab?.component}
        </div>
      </div>
    </div>
  );
};

export default Tabs;
