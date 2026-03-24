import Typo, { Typography } from "@zo/coal/typography";
import { cn } from "@zo/utils/font";
import React from "react";

interface TextLinkProps {
  children?: string;
  typo: Typography;
  className?: string;
  onClick?: () => void;
}

const TextLink: React.FC<TextLinkProps> = ({
  children,
  typo,
  className,
  onClick,
}) => {
  return (
    <button
      className={cn(
        "hover:text-zui-neon transition-all ease-in-out duration-150",
        className
      )}
      onClick={onClick}
    >
      <Typo type={typo}>{children}</Typo>
    </button>
  );
};

export default TextLink;
