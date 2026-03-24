import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    ref={ref}
    {...props}
  >
    <g fill={props.fill || "#fff"} clipPath="url(#a)">
      <path d="M2 1.333h8.667v1.333H2zM2 10.667h11.333V12H2zM12 2.667h1.333V4H12zM13.334 1.333h1.333v1.333h-1.333zM13.334 4h1.333v1.333h-1.333zM14.667 2.667H16V4h-1.333zM.667 2.667H2v8H.667zM13.334 6.667h1.333v4h-1.333zM7.333 12h1.333v1.333H7.333zM5.333 13.333h5.333v1.333H5.333z" />
    </g>
    <defs>
      <clipPath id="a">
        <path fill={props.fill || "#fff"} d="M0 0h16v16H0z" />
      </clipPath>
    </defs>
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
