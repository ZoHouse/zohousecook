import { cn } from "@zo/utils/font";
import React from "react";
import PageButton from "./PageButton";

interface PageButtonsGridProps {
  className?: string;
  links: {
    id: number;
    name: string;
    subtext?: string;
    link: string;
  }[];
}

const PageButtonsGrid: React.FC<PageButtonsGridProps> = ({
  links,
  className,
}) => {
  return (
    <div className={cn("flex flex-wrap w-full py-2 -mt-4 gap-2", className)}>
      {links.map((link) => (
        <PageButton key={link.id} {...link} />
      ))}
    </div>
  );
};

export default PageButtonsGrid;
