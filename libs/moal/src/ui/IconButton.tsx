import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";

interface IconButtonProps {
  icon?: IconName;
  className?: string;
  size?: number;
  fill?: string;
  onClick: () => void;
  isDisabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  className,
  fill,
  size,
  onClick,
  isDisabled,
}) => {
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "p-4 border border-zui-light",
        isDisabled && "cursor-not-allowed",
        className
      )}
    >
      <Icon name={icon || "Plus"} fill={fill || "#fff"} size={size || 24} />
    </button>
  );
};

export default IconButton;
