import { cn } from "@zo/utils/font";
import React, { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant - primary, secondary, or tertiary
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "tertiary";

  /**
   * Button size - default or small
   * @default "default"
   */
  size?: "default" | "small";

  /**
   * Button theme - light or dark
   * @default "light"
   */
  theme?: "light" | "dark";

  /**
   * Whether the button should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Icon to display before the button text
   */
  leftIcon?: ReactNode;

  /**
   * Icon to display after the button text
   */
  rightIcon?: ReactNode;

  /**
   * Whether the button is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Whether the button is in a success state
   * @default false
   */
  isSuccess?: boolean;

  /**
   * Button content
   */
  children: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      theme = "light",
      fullWidth = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      isSuccess = false,
      disabled = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Determine if the button should be disabled
    const isDisabled = disabled || isLoading;

    // Base classes for all buttons
    const baseClasses = [
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      fullWidth ? "w-full" : "",
    ];

    // Size classes
    const sizeClasses = {
      default: "h-14 px-6 py-3 text-base rounded-xl",
      small: "h-9 px-3 py-2 text-sm rounded-full",
    };

    // Theme and variant specific classes
    const variantClasses = {
      dark: {
        primary:
          "bg-zostel-light-background-primary text-zostel-light-text-primary hover:bg-zostel-light-background-secondary disabled:bg-zostel-light-background-secondary disabled:text-zostel-light-text-secondary disabled:cursor-not-allowed",
        secondary:
          "bg-transparent text-zostel-dark-text-primary border border-zostel-dark-stroke-primary hover:bg-zostel-dark-background-input disabled:text-zostel-dark-text-secondary disabled:border-zostel-dark-stroke-primary",
        tertiary:
          "bg-transparent text-zostel-dark-text-primary underline hover:opacity-80",
      },
      light: {
        primary:
          "bg-zostel-common-zostel text-white disabled:bg-zostel-light-background-secondary disabled:text-zostel-light-text-secondary disabled:cursor-not-allowed",
        secondary:
          "bg-zostel-light-background-primary text-zostel-common-zostel border-2 border-zostel-light-stroke-primary hover:bg-zostel-light-background-secondary disabled:text-zostel-light-text-secondary disabled:border-zostel-light-stroke-primary",
        tertiary:
          "bg-transparent text-zostel-common-zostel underline hover:opacity-80 disabled:text-zostel-light-text-secondary disabled:cursor-not-allowed disabled:opacity-50",
      },
    };

    // Combine all classes
    const buttonClasses = [
      ...baseClasses,
      sizeClasses[size],
      variantClasses[theme][variant],
      className,
    ].join(" ");

    // Render loading spinner
    const renderLoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    // Render success icon
    const renderSuccessIcon = () => (
      <svg
        className="-ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={cn(buttonClasses)}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && renderLoadingSpinner()}
        {isSuccess && !isLoading && renderSuccessIcon()}
        {leftIcon && !isLoading && !isSuccess && (
          <span className="mr-2 inline-flex">{leftIcon}</span>
        )}
        {children}
        {rightIcon && !isLoading && !isSuccess && (
          <span className="ml-2 inline-flex">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
