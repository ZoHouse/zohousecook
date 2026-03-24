import { cn, fontClassName } from "@zo/utils/font";
import React, { useMemo } from "react";

export type Typography =
  | "title"
  | "section-title"
  | "paragraph"
  | "text-highlight"
  | "subtitle"
  | "tertiary"
  | "big-button"
  | "small-button";

interface TypoProps {
  type?: Typography;
  inline?: boolean;
  className?: string;
  children?: string | (string | React.ReactNode)[];
}

const Typo: React.FC<TypoProps> = ({
  type = "paragraph",
  inline,
  className,
  children,
}) => {
  const Component = useMemo(
    () =>
      inline
        ? "span"
        : type === "title"
        ? "h1"
        : type === "section-title"
        ? "h2"
        : type === "paragraph"
        ? "p"
        : "span",
    [type, inline]
  );

  const classes = useMemo(() => {
    switch (type) {
      case "title":
        return "text-2xl font-semibold tracking-[0.01em]";
      case "section-title":
        return "text-xl font-semibold tracking-[0.01em]";
      case "paragraph":
        return "text-base font-normal tracking-[0.01em]";
      case "text-highlight":
        return "text-base font-bold tracking-[0.01em]";
      case "subtitle":
        return "text-sm font-normal tracking-[0.01em]";
      case "tertiary":
        return "text-xs font-normal tracking-[0.01em]";
      case "big-button":
        return "text-base font-bold tracking-[0.01em] leading-none";
      case "small-button":
        return "text-sm font-semibold tracking-[0.01em] leading-none";
      default:
        return "";
    }
  }, [type]);

  return (
    <Component className={cn(fontClassName, classes, className)}>
      {children}
    </Component>
  );
};

export default Typo;
