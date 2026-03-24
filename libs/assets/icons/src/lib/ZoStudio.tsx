import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="34"
    height="32"
    viewBox="0 0 34 32"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#fff"}
      fillRule="evenodd"
      d="M33.541 15.48 16.771 0 0 15.48 4.802 32h3.41L3.87 16.567 15.059 6.239v9.785h3.423V6.239L29.67 16.567 25.33 32h3.423l4.788-16.52ZM11.635 29.814h.001l5.175-6.511h-4.738v-3.11h10.01v2.162l-5.195 6.536h5.049V32H11.635v-2.187Z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
