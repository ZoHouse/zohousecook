import { cn } from "@zo/utils/font";
import React from "react";

interface PageContentProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}

const PageContent: React.FC<PageContentProps> = ({ children, className }) => {
  return (
    <section className={cn("py-10 w-full flex-1", className)}>
      {children}
    </section>
  );
};

export default PageContent;
