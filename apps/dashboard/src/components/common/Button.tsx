import { isValidString } from "@zo/utils/string";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: "dark" | "light";
  isLoading?: boolean;
  icon?: string;
  fixedsize?: boolean;
  iconClassName?: string;
}

const defaultClassName =
  "flex items-center space-x-[2vh] p-[2vh] text-[3vh] portrait:text-[4vw] relative active:top-1";
const defaultfixedsizeClassName =
  "flex items-center space-x-4 p-4 text-lg portrait:text-md relative active:top-1";
const darkThemeClassName = "bg-zui-black text-zui-white";
const lightThemeClassName = "bg-zui-white text-zui-black";

const Button = (props: ButtonProps, ref: React.Ref<HTMLButtonElement>) => {
  const { isLoading, icon, fixedsize, iconClassName, ...rest } = props;

  return (
    <button
      ref={ref}
      {...rest}
      className={`disabled:cursor-not-allowed ${
        props.fixedsize ? defaultfixedsizeClassName : defaultClassName
      } ${[
        props.theme === "light" ? lightThemeClassName : darkThemeClassName,
      ]} ${props.className || ""}`}
      disabled={props.disabled || props.isLoading}
    >
      {props.isLoading ? (
        <span className="font-medium">Please Wait ...</span>
      ) : (
        <>
          <span className="font-medium">{props.children}</span>
          {isValidString(props.icon) && (
            <div className="flex items-center justify-center relative w-4 h-4">
              <i
                className={`uil absolute uil-${props.icon} ${iconClassName}`}
              />
            </div>
          )}
        </>
      )}
    </button>
  );
};

const ForwardedButton = React.forwardRef(Button);

export default ForwardedButton;
