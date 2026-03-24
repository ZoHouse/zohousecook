import Icon, { IconName } from "@zo/assets/icons";
import { Button } from "@zo/moal";
import React from "react";

interface PageHeaderProps {
  title: string;
  icon?: IconName;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    className?: string;
    type: "primary" | "secondary";
    icon: IconName;
  }>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  buttons = [],
  title,
  icon,
}) => {
  return (
    <header className="md:ml-0 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {icon && <Icon name={icon} size={40} />}
        <h1 className="text-2xl font-medium">{title}</h1>
      </div>
      <div className="flex space-x-3">
        {buttons.map((button, index: number) => {
          return (
            <Button
              key={`btn-${index}`}
              type={button.type || "secondary"}
              icon={button.icon}
              onClick={button.onClick}
            >
              {button.label}
            </Button>
          );
        })}
      </div>
    </header>
  );
};

export default PageHeader;
