import React, { ReactNode } from "react";

interface TabPanelProps {
  title: string;
  children: ReactNode | ReactNode[];
}

const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
  return <>{children}</>;
};

export default TabPanel;
