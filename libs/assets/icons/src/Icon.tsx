import React from "react";
import type { IconName } from "./lib";
import icons from "./lib";

interface IconProps {
  className?: string;
  name: IconName;
  size?: number | string;
  fill?: string;
}

const Icon: React.FC<IconProps> = ({ name, size, fill, className }) => {
  const Name = React.createElement(icons[name], {
    width: size,
    height: size,
    className,
    fill,
  });
  return Name;
};

export default Icon;
