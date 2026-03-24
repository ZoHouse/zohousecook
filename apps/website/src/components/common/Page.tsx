import React from "react";
import { cn } from "../utils";

interface PageProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}

const Page: React.FC<PageProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-[1400px] w-full lg:px-[108px] flex-1 px-6 pt-20 lg:pt-32 lg:pt-[180px]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Page;
