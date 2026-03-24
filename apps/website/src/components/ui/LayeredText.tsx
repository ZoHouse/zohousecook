import { cn } from "@zo/utils/font";
import React from "react";
import { rubikClassName } from "../utils";

interface LayeredTextProps {
  text: string;
  className?: string;
}

const LayeredText: React.FC<LayeredTextProps> = ({ className, text }) => {
  return (
    <div
      className={cn(
        "relative font-bold text-white text-[40px] font-black",
        rubikClassName,
        className
      )}
    >
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={`absolute top-0 left-0 text-transparent stroke-text`}
          style={{
            transform: `translate(${index * 3}px, ${index * 3}px)`,
            color: index === 0 ? "black" : "white",
            zIndex: -index,
          }}
        >
          {text}
        </span>
      ))}
      <span className="relative text-white stroke-text">{text}</span>
    </div>
  );
};

export default LayeredText;
