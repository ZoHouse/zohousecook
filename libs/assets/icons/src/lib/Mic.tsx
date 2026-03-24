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
      d="M8 20h8v2H8zM11 18h2v2h-2zM4 10h2v4H4zM6 14h2v2H6zM16 14h2v2h-2zM8 16h8v2H8zM18 10h2v4h-2zM10 2h4v2h-4zM10 12h4v2h-4zM8 4h2v8H8zM14 4h2v8h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
