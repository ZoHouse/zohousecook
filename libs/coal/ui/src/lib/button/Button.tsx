import Icon, { IconName } from "@zo/assets/icons";
import Typo from "@zo/coal/typography";
import { cn } from "@zo/utils/font";
import React from "react";

interface ButtonProps {
  children?: string;
  onClick?: () => void;
  className?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "primary-icon"
    | "secondary-icon";
  icon?: IconName;
  loadingPercent?: number;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className,
  isDisabled,
  isLoading,
  type = "button",
  variant = "primary",
  icon,
  loadingPercent,
}) => {
  return (
    <button
      disabled={isDisabled}
      type={type}
      onClick={onClick}
      className={cn(
        "transition-all ease-in-out duration-150 flex items-center px-4 h-12 gap-x-2 border",
        variant === "primary"
          ? "bg-zui-white text-zui-dark border-zui-whit hover:bg-opacity-70"
          : variant === "secondary"
          ? "bg-transparent text-zui-white border-zui-light hover:bg-zui-lighter"
          : "",
        className
      )}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          fill={variant === "primary" ? "#121212" : "#FFF"}
        />
      )}
      <Typo type="small-button">{children}</Typo>
    </button>
  );
};

export default Button;
