import Icon, { IconName } from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { cn } from "@zo/utils/font";
import React from "react";

interface ButtonProps {
  children: string;
  onClick?: () => void;
  type?: "primary" | "secondary";
  disabled?: boolean;
  icon?: IconName;
  isLoading?: boolean;
  size?: "sm" | "md";
  htmlType?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  htmlType,
  onClick,
  type = "primary",
  isLoading,
  disabled,
  icon,
  size = "md",
  className,
}) => {
  return (
    <button
      type={htmlType}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center cursor-pointer gap-3 border flex-1 transition-all relative",
        type === "primary" &&
          "bg-zui-white disabled:bg-zui-white/70 text-zui-dark border-zui-white",
        type === "secondary" &&
          "bg-transparent disabled:bg-zui-lighter/70 hover:bg-transparent/10 text-zui-white border-zui-light",
        size === "sm" && "text-sm px-5 py-3 font-medium",
        size === "md" && "text-base px-6 py-4 font-semibold",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {!isLoading && icon && (
        <Icon
          name={icon}
          size={size === "sm" ? 16 : 24}
          fill={type === "primary" ? "#121212" : "#FFF"}
        />
      )}
      <span className="whitespace-nowrap">{children}</span>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zui-dark">
          <Loader className="w-4 h-4" />
        </div>
      ) : null}
    </button>
  );
};

export default Button;
