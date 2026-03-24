import React from "react";

interface PageContentProps {
  children: React.ReactNode | React.ReactNode[];
}

const PageContent: React.FC<PageContentProps> = ({ children }) => {
  return <section className="py-10 w-full">{children}</section>;
};

export default PageContent;
