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
    <path
      fill={props.fill || "#5a5a5a"}
      d="M8.667 1.333V8H7.334V1.333zM8.667 9.333v1.333H7.334V9.333zM10 8v1.333H8.667V8zM11.333 6.667V8H10V6.667zM7.333 8v1.333H6V8zM6 6.667V8H4.667V6.667zM1.333 6.667h1.333v6.667H1.333zM2.667 13.333h10.667v1.333H2.667z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="M13.333 6.667h1.333v6.667h-1.333z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
