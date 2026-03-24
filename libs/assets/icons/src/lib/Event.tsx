import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#5a5a5a"}
      d="M4 1.333h1.333v1.333H4zM2.667 13.333h10.667v1.333H2.667zM2.667 2.667h10.667V4H2.667zM1.333 4h1.333v9.333H1.333zM13.333 4h1.333v9.333h-1.333zM10.667 1.333H12v1.333h-1.333zM4.667 8h2.667v1.333H4.667zM7.333 5.333h1.333V8H7.333zM7.333 9.333h1.333V12H7.333zM8.667 8h2.667v1.333H8.667z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
