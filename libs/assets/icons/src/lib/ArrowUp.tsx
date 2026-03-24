import * as React from "react";
import { SVGProps } from "react";
const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      fill="#111"
      fillOpacity={0.44}
      fillRule="evenodd"
      d="M2.293 8.207a1 1 0 0 0 1.414 0L6 5.914l2.293 2.293a1 1 0 0 0 1.414-1.414l-3-3a1 1 0 0 0-1.414 0l-3 3a1 1 0 0 0 0 1.414Z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgComponent;
