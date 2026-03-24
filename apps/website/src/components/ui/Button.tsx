import { Loader } from "@zo/assets/lotties";
import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import React from "react";
import { rubikClassName } from "../utils";

interface ButtonProps {
  children: string | React.ReactNode;
  onClick?: () => void;
  type?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  showEffect?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "primary",
  disabled,
  className,
  isLoading,
  showEffect = true,
}) => {
  const { isMobile } = useWindowSize();

  return type === "tertiary" ? (
    <button
      disabled={disabled}
      onClick={onClick}
      role="link"
      className={cn(
        "relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-zui-white text-white after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100 font-medium",
        rubikClassName,
        className
      )}
    >
      {children}
    </button>
  ) : type === "secondary" ? (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full md:w-[288px] text-base overflow-hidden rounded-xl bg-transparent px-10 py-4 font-semibold text-white",
        showEffect && "inner-border-white-2",
        rubikClassName,
        className
      )}
    >
      <span>{children}</span>
    </button>
  ) : (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full md:w-[288px] mx-auto text-base relative flex justify-center items-center text-zui-dark px-10 py-4 cursor-pointer rounded-xl font-semibold",
        "bg-white",
        rubikClassName,
        disabled
          ? "bg-zui-lightest text-zui-silver  cursor-not-allowed"
          : "cursor-pointer",
        isLoading && "bg-zui-lightest border-2 border-zui-white",
        showEffect && !disabled && "primary-button",
        className
      )}
    >
      {isLoading ? <Loader className="h-6 w-6" /> : <div>{children}</div>}
    </button>
  );
};

export default Button;
