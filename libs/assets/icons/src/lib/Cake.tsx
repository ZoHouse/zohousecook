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
    fill={props.fill || "#FFF"}
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#FFF"}
      d="M4 10h2v8H4zM8 4h2v4H8zM8 13h2v2H8zM14 13h2v2h-2zM14 4h2v4h-2zM2 18h20v2H2zM6 8h12v2H6zM18 10h2v8h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
