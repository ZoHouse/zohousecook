import React from "react";

interface PageProps {
  children: React.ReactNode | React.ReactNode[];
}

const Page: React.FC<PageProps> = ({ children }) => {
  return (
    <div className="mx-auto max-w-[1400px] w-full lg:px-[108px] flex-1 px-6 pt-32 lg:pt-[180px]">
      {children}
    </div>
  );
};

export default Page;
