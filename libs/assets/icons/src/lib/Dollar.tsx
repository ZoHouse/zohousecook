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
      fill={props.fill || "#fff"}
      d="M8 5h10v2H8zM6 17h10v2H6zM8 11h8v2H8zM6 7h2v4H6zM11 3h2v2h-2zM11 19h2v2h-2zM16 13h2v4h-2z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
