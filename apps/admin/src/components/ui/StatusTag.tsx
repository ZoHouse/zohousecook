import { cn } from "@zo/utils/font";
import React from "react";

interface StatusTagProps {
  config: {
    [key: string]: {
      background: string;
      foreground: string;
      textOnly: string;
    };
  };
  value: string;
  textOnly?: boolean;
  children: string;
  className?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({
  config,
  children,
  textOnly,
  value,
  className,
}) => {
  return (
    <span
      className={cn(
        "capitalize",
        config[value] != null
          ? textOnly
            ? config[value].textOnly
            : `text-[11px] px-2 py-1 ${config[value].background} ${config[value].foreground}`
          : "",
        className
      )}
    >
      {children}
    </span>
  );
};

export default StatusTag;
