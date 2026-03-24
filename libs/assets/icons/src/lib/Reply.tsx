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
    {...props}>
    <path
      fill={props.fill || "#fff"}
      d="M4 10H2v2h2zM10 10H8v2h2zM14 10h-2v2h2zM18 10h-2v2h2zM22 10h-2v2h2zM22 14h-2v2h2zM22 18h-2v2h2zM7 13H5v2h2zM7 7H5v2h2zM10 16H8v2h2zM10 4H8v2h2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
